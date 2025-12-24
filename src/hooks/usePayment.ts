import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardMachine } from "@/services/database/machines";
import { completeSale, SaleItem, SalePayment } from "@/services/database/sales";
import { getAppSettings } from "@/services/database/settings";
import type { PaymentEntry } from "@/components/features/partial-payment/PartialPaymentBuilder";
import type { PixKey } from "@/services/database/pix_keys";
import type { Client } from "@/components/features/clients/types";

export function usePayment() {
    const navigate = useNavigate();
    const { items, total } = useCartStore();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);

    const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
    const [machines, setMachines] = useState<CardMachine[]>([]);
    
    const [selectedPixKey, setSelectedPixKey] = useState<string>("");
    const [selectedMachine, setSelectedMachine] = useState<string>("");
    const [selectedFlag, setSelectedFlag] = useState<string>("");
    
    const [amountGiven, setAmountGiven] = useState<string>("");

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [isPartialPayment, setIsPartialPayment] = useState(false);
    const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

    const [scheduledPickup, setScheduledPickup] = useState<Date | null>(null);

    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
    const [deliveryFee, setDeliveryFee] = useState<number>(0);

    const [manualAddress, setManualAddress] = useState<{
        zipCode: string;
        street: string;
        number: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
    }>({
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: ""
    });

    useEffect(() => {
        // Load default delivery fee
        getAppSettings().then(({ data }) => {
            if (data) {
                setDeliveryFee(data.fixed_delivery_fee);
            }
        });
    }, []);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/pdv");
        }
        loadPaymentData();
    }, [items, navigate]);

    const loadPaymentData = async () => {
        const { data: keys } = await supabase.from("pix_keys").select("*").eq("active", true);
        if (keys) setPixKeys(keys as unknown as PixKey[]);

        const { data: machs } = await supabase
            .from("card_machines")
            .select(`*, flags:card_flags(*)`);
        
        if (machs) setMachines(machs);
    };

    const calculateTotalWithFees = () => {
        let currentTotal = total();
        if ((selectedMethod === "card_credit" || selectedMethod === "card_debit") && selectedFlag) {
            const machine = machines.find(m => m.id === selectedMachine);
            const flag = machine?.flags?.find(f => f.id === selectedFlag);
            if (flag) {
                currentTotal = currentTotal * (1 + flag.tax_rate / 100);
            }
        }
        
        if (isDelivery) {
            currentTotal += deliveryFee;
        }

        return currentTotal;
    };

    const calculateChange = () => {
        const given = parseFloat(amountGiven.replace(",", ".")) || 0;
        const totalAmount = calculateTotalWithFees();
        return Math.max(0, given - totalAmount);
    };

    const getTotalAllocated = () => {
        return paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
    };

    const getRemainingBalance = () => {
        return calculateTotalWithFees() - getTotalAllocated();
    };

    const addPaymentEntry = (entry: PaymentEntry) => {
        setPaymentEntries([...paymentEntries, entry]);
    };

    const removePaymentEntry = (id: string) => {
        setPaymentEntries(paymentEntries.filter(entry => entry.id !== id));
    };

    const handleConfirm = async () => {
        // Validation: Delivery requires address
        if (isDelivery) {
             if (!deliveryAddressId) {
                 if (!manualAddress.street || !manualAddress.number || !manualAddress.neighborhood) {
                     toast.error("Selecione um endereço ou preencha o endereço manual");
                     return;
                 }
            }
        }

        if (isPartialPayment) {
            if (paymentEntries.length === 0) {
                toast.error("Adicione pelo menos um método de pagamento");
                return;
            }
            
            const remaining = getRemainingBalance();
            const hasCashOverpayment = remaining < -0.01 && paymentEntries.some(e => e.method === 'cash');
            
            if (remaining > 0.01 || (remaining < -0.01 && !hasCashOverpayment)) {
                toast.error("O valor alocado deve ser igual ou maior que o total (com dinheiro para troco)");
                return;
            }
        } else {
            if (!selectedMethod) return;

            // Validation: Pix requires key selection
            if (selectedMethod === 'pix' && !selectedPixKey) {
                toast.error("Selecione uma chave Pix");
                return;
            }
        }

        setIsProcessing(true);
        try {
            const totalAmount = calculateTotalWithFees();
            
            let changeAmount = 0;
            if (isPartialPayment) {
                const remaining = getRemainingBalance();
                if (remaining < 0 && paymentEntries.some(e => e.method === 'cash')) {
                    changeAmount = Math.abs(remaining);
                }
            } else if (selectedMethod === 'cash') {
                changeAmount = calculateChange();
            }

            const saleItems: SaleItem[] = items.flatMap(item => {
                if (item.subItems && item.subItems.length > 0) {
                   return item.subItems.map(sub => ({
                       product_catalog_id: item.id,
                       product_item_id: sub.id === item.id ? null : sub.id,
                       name: `${item.name} (${sub.weight}kg)`,
                       unit_price: sub.price,
                       quantity: 1,
                       total_price: sub.price
                   }));
                }

                return [{
                    product_catalog_id: item.id,
                    product_item_id: null,
                    name: item.name,
                    unit_price: item.base_price,
                    quantity: item.quantity,
                    total_price: item.base_price * item.quantity
                }];
            });

            let payments: SalePayment[];

            if (isPartialPayment) {
                payments = paymentEntries.map(entry => {
                    const payment: SalePayment = {
                        amount: entry.amount,
                        payment_method: entry.method as SalePayment['payment_method'],
                        installments: 1
                    };

                    if (entry.method === 'pix' && entry.details?.pixKeyId) {
                        payment.pix_key_id = entry.details.pixKeyId;
                    } else if ((entry.method === 'card_credit' || entry.method === 'card_debit') && entry.details?.machineId) {
                        payment.machine_id = entry.details.machineId;
                        payment.card_flag = entry.details.cardBrand;
                    }

                    return payment;
                });
            } else {
                const payment: SalePayment = {
                    amount: totalAmount,
                    payment_method: selectedMethod as SalePayment['payment_method'],
                    installments: 1
                };

                if (selectedMethod === 'pix') {
                    payment.pix_key_id = selectedPixKey;
                } else if (selectedMethod === 'card_credit' || selectedMethod === 'card_debit') {
                    payment.machine_id = selectedMachine;
                    payment.card_flag = machines.find(m => m.id === selectedMachine)?.flags?.find(f => f.id === selectedFlag)?.brand;
                }

                payments = [payment];
            }

            const { data, error } = await completeSale({
                sale: {
                    total_amount: totalAmount,
                    client_id: selectedClient?.id || null,
                    notes: notes || null,
                    change_amount: changeAmount,
                    scheduled_pickup: scheduledPickup?.toISOString() || null,
                    is_delivery: isDelivery,
                    delivery_address_id: deliveryAddressId,
                    delivery_fee: isDelivery ? deliveryFee : 0,
                    ...(isDelivery && !deliveryAddressId ? {
                        delivery_zip_code: manualAddress.zipCode,
                        delivery_street: manualAddress.street,
                        delivery_number: manualAddress.number,
                        delivery_complement: manualAddress.complement,
                        delivery_neighborhood: manualAddress.neighborhood,
                        delivery_city: manualAddress.city,
                        delivery_state: manualAddress.state
                    } : {})
                },
                items: saleItems,
                payments: payments
            });

            if (error) throw error;

            const pixEntry = isPartialPayment ? paymentEntries.find(e => e.method === 'pix') : null;
            const pixPaymentAmount = pixEntry ? pixEntry.amount : (selectedMethod === 'pix' ? totalAmount : null);
            const pixKeyObject = pixEntry?.details?.pixKeyId 
                ? pixKeys.find(k => k.id === pixEntry.details?.pixKeyId)
                : (selectedMethod === 'pix' ? pixKeys.find(k => k.id === selectedPixKey) : null);

            navigate('/pdv/success', {
                state: {
                    saleId: data?.sale_id,
                    displayId: data?.display_id,
                    total: totalAmount,
                    subtotal: total(),
                    method: isPartialPayment ? 'multiple' : selectedMethod,
                    clientId: selectedClient?.id,
                    clientName: selectedClient?.name,
                    clientPhone: selectedClient?.phone,
                    items: items,
                    change: changeAmount,
                    pixKey: pixKeyObject,
                    pixAmount: pixPaymentAmount,
                    isDelivery,
                    deliveryAddressId,
                    deliveryFee
                }
            });

        } catch (error) {
            toast.error("Erro ao processar venda");
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        items,
        total,
        selectedMethod,
        setSelectedMethod,
        notes,
        setNotes,
        isProcessing,
        showPixModal,
        setShowPixModal,
        pixKeys,
        machines,
        selectedPixKey,
        setSelectedPixKey,
        selectedMachine,
        setSelectedMachine,
        selectedFlag,
        setSelectedFlag,
        amountGiven,
        setAmountGiven,
        calculateTotalWithFees,
        calculateChange,
        handleConfirm,
        selectedClient,
        setSelectedClient,
        isPartialPayment,
        setIsPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,
        getTotalAllocated,
        getRemainingBalance,
        scheduledPickup,
        setScheduledPickup,
        isDelivery,
        setIsDelivery,
        deliveryAddressId,
        setDeliveryAddressId,
        deliveryFee,
        setDeliveryFee,
        manualAddress,
        setManualAddress
    };
}

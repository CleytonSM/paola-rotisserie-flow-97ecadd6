import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardMachine } from "@/services/database/machines";
import { completeSale, SaleItem, SalePayment } from "@/services/database/sales";
import type { PaymentEntry } from "@/components/ui/partial-payment/PartialPaymentBuilder";

export function usePayment() {
    const navigate = useNavigate();
    const { items, total, clearCart } = useCartStore();
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);

    // Data from DB
    const [pixKeys, setPixKeys] = useState<any[]>([]);
    const [machines, setMachines] = useState<CardMachine[]>([]);
    
    // Selection State
    const [selectedPixKey, setSelectedPixKey] = useState<string>("");
    const [selectedMachine, setSelectedMachine] = useState<string>("");
    const [selectedFlag, setSelectedFlag] = useState<string>("");
    
    // Cash State
    const [amountGiven, setAmountGiven] = useState<string>("");

    // Client State
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    // Partial Payment State
    const [isPartialPayment, setIsPartialPayment] = useState(false);
    const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/pdv");
        }
        loadPaymentData();
    }, [items, navigate]);

    const loadPaymentData = async () => {
        const { data: keys } = await supabase.from("pix_keys").select("*").eq("active", true);
        if (keys) setPixKeys(keys);

        const { data: machs } = await supabase
            .from("card_machines")
            .select(`
                *,
                flags:card_flags(*)
            `);
        
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
        // For partial payments, validate entries
        if (isPartialPayment) {
            if (paymentEntries.length === 0) {
                toast.error("Adicione pelo menos um método de pagamento");
                return;
            }
            
            const remaining = getRemainingBalance();
            if (Math.abs(remaining) > 0.01) {
                toast.error("O valor alocado deve ser igual ao total da venda");
                return;
            }
        } else {
            // Single payment mode - validate as before
            if (!selectedMethod) return;
        }

        setIsProcessing(true);
        try {
            const totalAmount = calculateTotalWithFees();
            const changeAmount = selectedMethod === 'cash' ? calculateChange() : 0;

            // Prepare Items
            const saleItems: SaleItem[] = items.flatMap(item => {
                if (item.subItems && item.subItems.length > 0) {
                   return item.subItems.map(sub => ({
                       product_catalog_id: item.id,
                       product_item_id: sub.id,
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

            // Prepare Payments
            let payments: SalePayment[];

            if (isPartialPayment) {
                // Convert payment entries to SalePayment format
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
                // Single payment mode
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

            // Call Service
            const { data, error } = await completeSale({
                sale: {
                    total_amount: totalAmount,
                    client_id: selectedClient?.id || null,
                    notes: notes || null,
                    change_amount: changeAmount
                },
                items: saleItems,
                payments: payments
            });

            if (error) throw error;

            // Calculate pixAmount and pixKey for SuccessPage (partial or single)
            const pixEntry = isPartialPayment ? paymentEntries.find(e => e.method === 'pix') : null;
            const pixPaymentAmount = pixEntry ? pixEntry.amount : (selectedMethod === 'pix' ? totalAmount : null);
            const pixKeyObject = pixEntry?.details?.pixKeyId 
                ? pixKeys.find(k => k.id === pixEntry.details.pixKeyId)
                : (selectedMethod === 'pix' ? pixKeys.find(k => k.id === selectedPixKey) : null);

            navigate('/pdv/success', {
                state: {
                    saleId: data?.sale_id,
                    displayId: data?.display_id,
                    total: totalAmount,
                    subtotal: total(),
                    method: isPartialPayment ? 'multiple' : selectedMethod,
                    clientName: selectedClient?.name,
                    items: items,
                    change: changeAmount,
                    pixKey: pixKeyObject,
                    pixAmount: pixPaymentAmount
                }
            });

        } catch (error) {
            console.error(error);
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
        // Partial payment exports
        isPartialPayment,
        setIsPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,
        getTotalAllocated,
        getRemainingBalance
    };
}

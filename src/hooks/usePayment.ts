import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardMachine } from "@/services/database/machines";
import { completeSale, SaleItem, SalePayment } from "@/services/database/sales";

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
                // Add fee percentage
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

    const handleConfirm = async () => {
        if (!selectedMethod) return;

        setIsProcessing(true);
        try {
            const totalAmount = calculateTotalWithFees();
            const changeAmount = selectedMethod === 'cash' ? calculateChange() : 0;

            // Prepare Items
            const saleItems: SaleItem[] = items.flatMap(item => {
                // If it's a grouped internal item, we should split it into individual sales items 
                // IF we want to track them individually (e.g. for statistics). 
                // However, the cart item structure for internal items groups them.
                // Our schema allows "snapshot" names.
                
                if (item.subItems && item.subItems.length > 0) {
                   return item.subItems.map(sub => ({
                       product_catalog_id: item.id, // The group ID is the catalog ID
                       product_item_id: sub.id, // Specific item ID
                       name: `${item.name} (${sub.weight}kg)`, // Descriptive name
                       unit_price: sub.price, // Price of this specific item
                       quantity: 1,
                       total_price: sub.price
                   }));
                }

                // Standard item or simple internal item
                return [{
                    product_catalog_id: item.id,
                    product_item_id: null, // Standard items might not have specific item IDs unless tracked. Assuming null for generic stock.
                    name: item.name,
                    unit_price: item.base_price,
                    quantity: item.quantity,
                    total_price: item.base_price * item.quantity
                }];
            });

            // Prepare Payments
            // Currently supporting single payment method per sale, but structure allows multiple.
            const payment: SalePayment = {
                amount: totalAmount, // For now, 100% of amount
                payment_method: selectedMethod as SalePayment['payment_method'],
                installments: 1
            };

            if (selectedMethod === 'pix') {
                payment.pix_key_id = selectedPixKey;
            } else if (selectedMethod === 'card_credit' || selectedMethod === 'card_debit') {
                payment.machine_id = selectedMachine;
                payment.card_flag = machines.find(m => m.id === selectedMachine)?.flags?.find(f => f.id === selectedFlag)?.brand;
            }

            // Call Service
            const { data, error } = await completeSale({
                sale: {
                    total_amount: totalAmount,
                    client_id: selectedClient?.id,
                    notes: notes,
                    change_amount: changeAmount
                },
                items: saleItems,
                payments: [payment]
            });

            if (error) throw error;

            console.log('Complete Sale Data:', data);

            if (data?.sale_id) {
                // Pass necessary data for Success Page (especially for Pix re-display)
                navigate("/pdv/success", { 
                    state: { 
                        saleId: data.sale_id,
                        displayId: data.display_id, 
                        total: totalAmount, 
                        subtotal: total(),
                        method: selectedMethod,
                        clientName: selectedClient?.name,
                        items: items, // Pass items for receipt printing
                        change: changeAmount, // Pass change amount for receipt
                        
                        // Pass Pix Data for modal re-opening
                        pixKey: selectedMethod === 'pix' ? pixKeys.find(k => k.id === selectedPixKey) : null,
                        pixAmount: totalAmount
                    } 
                });
                // We do NOT clear cart here immediately if we want to allow "back"? 
                // No, standard flow is to clear. Success page has "New Sale" button.
                // We'll clear it here to ensure state consistency.
                // clearCart(); // Moved to SuccessPage to prevent race condition
            }

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
        setSelectedClient
    };
}

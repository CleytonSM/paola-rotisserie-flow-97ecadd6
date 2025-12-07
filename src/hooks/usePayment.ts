import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardMachine, CardFlag } from "@/services/database/machines";

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

        const { data: machs, error } = await supabase
            .from("card_machines")
            .select(`
                *,
                flags:card_flags(*)
            `);
        
        if (machs) setMachines(machs);
    };

    const calculateTotalWithFees = () => {
        let currentTotal = total();
        if ((selectedMethod === "credit_card" || selectedMethod === "debit_card") && selectedFlag) {
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

            // 1. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from("sales")
                .insert([{
                    total_amount: totalAmount,
                    payment_method: selectedMethod,
                    notes: notes,
                    status: "completed"
                    // client_id: selectedClient?.id // TODO: Enable when DB schema is ready
                }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items
            const saleItems = items.map(item => ({
                sale_id: sale.id,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.base_price,
                total_price: item.base_price * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from("sales_items")
                .insert(saleItems);

            if (itemsError) throw itemsError;

            // 3. Create Account Receivable
            const { error: arError } = await supabase
                .from("accounts_receivable")
                .insert([{
                    description: `Venda PDV #${sale.id.slice(0, 8)}`,
                    amount: totalAmount,
                    due_date: new Date().toISOString(),
                    status: "paid",
                    payment_method: selectedMethod
                }]);

            if (arError) throw arError;

            navigate("/pdv/success", { state: { orderId: sale.id, total: totalAmount, method: selectedMethod } });
            clearCart();
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

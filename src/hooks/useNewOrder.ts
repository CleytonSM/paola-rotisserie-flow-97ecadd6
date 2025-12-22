import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeSale, SaleItem, SalePayment, SaleData } from "@/services/database/sales";
import { ProductCatalog } from "@/services/database/product-catalog";
import { Client } from "@/components/features/clients/types";
import { ClientAddress } from "@/types/entities";
import { PaymentEntry } from "@/components/features/partial-payment/PartialPaymentBuilder";
import { useAppSettings } from "./useAppSettings";
import { useSoundNotifications } from "./useSoundNotifications";

export interface NewOrderItem {
    id: string;
    product: ProductCatalog;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productItemId?: string;
}

export function useNewOrder(onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const { settings } = useAppSettings();
    const { playOrderCreated } = useSoundNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [items, setItems] = useState<NewOrderItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [scheduledPickup, setScheduledPickup] = useState<Date | null>(null);
    const [notes, setNotes] = useState("");

    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
    const [deliveryFee, setDeliveryFee] = useState<number>(0);

    const [hasPartialPayment, setHasPartialPayment] = useState(false);
    const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
    }, [items]);

    const total = useMemo(() => {
        return subtotal + (isDelivery ? deliveryFee : 0);
    }, [subtotal, isDelivery, deliveryFee]);

    const reset = useCallback(() => {
        setItems([]);
        setSelectedClient(null);
        setScheduledPickup(null);
        setNotes("");
        setIsDelivery(false);
        setDeliveryAddressId(null);
        setDeliveryFee(0);
        setHasPartialPayment(false);
        setPaymentEntries([]);
    }, []);

    const open = useCallback(() => {
        reset();
        const defaultFee = settings?.fixed_delivery_fee ?? 0;
        setDeliveryFee(defaultFee);
        setIsOpen(true);
    }, [reset, settings?.fixed_delivery_fee]);

    const close = useCallback(() => {
        setIsOpen(false);
        reset();
    }, [reset]);

    const addItem = useCallback((product: ProductCatalog, quantity: number = 1, productItemId?: string) => {
        const existingIndex = items.findIndex(item => item.product.id === product.id && item.productItemId === productItemId);

        if (existingIndex >= 0) {
            setItems(prev => prev.map((item, index) => {
                if (index === existingIndex) {
                    const newQuantity = item.quantity + quantity;
                    return {
                        ...item,
                        quantity: newQuantity,
                        totalPrice: newQuantity * item.unitPrice
                    };
                }
                return item;
            }));
        } else {
            const newItem: NewOrderItem = {
                id: crypto.randomUUID(),
                product,
                quantity,
                unitPrice: product.base_price,
                totalPrice: product.base_price * quantity,
                productItemId // Enhanced to store it
            };
            setItems(prev => [...prev, newItem]);
        }
    }, [items]);

    const [selectionOpen, setSelectionOpen] = useState(false);
    const [selectedProductForSelection, setSelectedProductForSelection] = useState<ProductCatalog | null>(null);

    const handleProductSelect = useCallback((product: ProductCatalog) => {
        if (product.is_internal) {
            setSelectedProductForSelection(product);
            setSelectionOpen(true);
        } else {
            addItem(product);
        }
    }, [addItem]);

    const handleAddInternalItem = useCallback((item: any) => {
        if (!selectedProductForSelection) return;
        
        // If 'item' is the specific ProductItem selected from the dialog
        const productItemId = item?.id;
        
        addItem(selectedProductForSelection, 1, productItemId);
        setSelectionOpen(false);
        setSelectedProductForSelection(null);
    }, [addItem, selectedProductForSelection]);

    const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems(prev => prev.filter(item => item.id !== itemId));
        } else {
            setItems(prev => prev.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        quantity,
                        totalPrice: quantity * item.unitPrice
                    };
                }
                return item;
            }));
        }
    }, []);

    const removeItem = useCallback((itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    }, []);

    const addPaymentEntry = useCallback((entry: PaymentEntry) => {
        setPaymentEntries(prev => [...prev, entry]);
    }, []);

    const removePaymentEntry = useCallback((id: string) => {
        setPaymentEntries(prev => prev.filter(e => e.id !== id));
    }, []);

    const canSubmit = useMemo(() => {
        if (items.length === 0) return false;
        if (!scheduledPickup) return false;
        if (isDelivery && !deliveryAddressId) return false;
        return true;
    }, [items, scheduledPickup, isDelivery, deliveryAddressId]);

    const submit = useCallback(async () => {
        if (!canSubmit) {
            if (items.length === 0) {
                toast.error("Adicione pelo menos um produto");
                return;
            }
            if (!scheduledPickup) {
                toast.error("Selecione a data e hora de retirada/entrega");
                return;
            }
            if (isDelivery && !deliveryAddressId) {
                toast.error("Selecione um endereço de entrega");
                return;
            }
            return;
        }

        setIsSubmitting(true);

        try {
            const saleItems: SaleItem[] = items.map(item => ({
                product_catalog_id: item.product.id,
                product_item_id: null,
                name: item.product.name,
                unit_price: item.unitPrice,
                quantity: item.quantity,
                total_price: item.totalPrice
            }));

            const saleData: SaleData = {
                total_amount: total,
                client_id: selectedClient?.id || null,
                notes: notes || null,
                scheduled_pickup: scheduledPickup.toISOString(),
                is_delivery: isDelivery,
                delivery_address_id: isDelivery ? deliveryAddressId : null,
                delivery_fee: isDelivery ? deliveryFee : 0
            };

            let payments: SalePayment[] = [];

            if (hasPartialPayment && paymentEntries.length > 0) {
                payments = paymentEntries.map(entry => ({
                    amount: entry.amount,
                    payment_method: entry.method as 'pix' | 'cash' | 'card_credit' | 'card_debit',
                    pix_key_id: entry.details?.pixKeyId,
                    machine_id: entry.details?.machineId,
                    card_flag: entry.details?.cardBrand
                }));
            }

            const { data, error } = await completeSale({
                sale: saleData,
                items: saleItems,
                payments
            });

            if (error) throw error;

            playOrderCreated();

            toast.success(`Pedido #${data?.display_id} criado com sucesso!`);

            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingOrders'] });

            close();
            onSuccess?.();
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Erro ao criar pedido");
        } finally {
            setIsSubmitting(false);
        }
    }, [
        canSubmit, items, scheduledPickup, isDelivery, deliveryAddressId,
        total, selectedClient, notes, deliveryFee, hasPartialPayment,
        paymentEntries, queryClient, close, onSuccess
    ]);

    const prefill = useCallback((data: {
        client?: Client;
        items?: NewOrderItem[];
        scheduledPickup?: Date;
        notes?: string;
        clientName?: string;
    }) => {
        reset();
        if (data.client) setSelectedClient(data.client);
        if (data.items) setItems(data.items);
        if (data.scheduledPickup) setScheduledPickup(data.scheduledPickup);
        
        let finalNotes = "";
        if (data.clientName) {
            finalNotes = `Cliente: ${data.clientName}\n`;
        }
        if (data.notes) {
            finalNotes += data.notes;
        }
        setNotes(finalNotes.trim());
        
        const defaultFee = settings?.fixed_delivery_fee ?? 0;
        setDeliveryFee(defaultFee);
        
        setIsOpen(true);
    }, [reset, settings?.fixed_delivery_fee]);

    return {
        isOpen,
        open,
        close,
        prefill,

        items,
        addItem,
        updateItemQuantity,
        removeItem,

        selectedClient,
        setSelectedClient,

        scheduledPickup,
        setScheduledPickup,

        notes,
        setNotes,

        isDelivery,
        setIsDelivery,
        deliveryAddressId,
        setDeliveryAddressId,
        deliveryFee,
        setDeliveryFee,

        hasPartialPayment,
        setHasPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,

        subtotal,
        total,

        isSubmitting,
        canSubmit,
        submit,
        reset,

        // Selection dialog
        selectionOpen,
        setSelectionOpen,
        selectedProductForSelection,
        handleProductSelect,
        handleAddInternalItem
    };
}

import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeSale, updateOrder, SaleItem, SalePayment, SaleData } from "@/services/database/sales";
import { ProductCatalog } from "@/services/database/product-catalog";
import { Client } from "@/components/features/clients/types";
import { ClientAddress } from "@/types/entities";
import { PaymentEntry } from "@/components/features/partial-payment/PartialPaymentBuilder";
import { useAppSettings } from "./useAppSettings";
import { useSoundNotifications } from "./useSoundNotifications";
import { ParsedAddress } from "@/utils/whatsappParser";

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

    const [hasPartialPayment, setHasPartialPayment] = useState(false);
    const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

    // Track which fields were populated by WhatsApp import for visual highlighting
    const [importedFields, setImportedFields] = useState<{
        items: boolean;
        scheduledPickup: boolean;
        notes: boolean;
        clientName: boolean;
        paymentMethod: boolean;
    }>({ items: false, scheduledPickup: false, notes: false, clientName: false, paymentMethod: false });

    // Edit Mode State
    const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
    const [existingDisplayId, setExistingDisplayId] = useState<number | null>(null);

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
        setImportedFields({ items: false, scheduledPickup: false, notes: false, clientName: false, paymentMethod: false });
        setExistingOrderId(null);
        setExistingDisplayId(null);
        setManualAddress({
            zipCode: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: ""
        });
    }, []);

    // ... (keep generic state management code)

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

    const addItem = useCallback((product: ProductCatalog, quantity: number = 1, productItemId?: string, overridePrice?: number) => {
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
            const price = overridePrice !== undefined ? overridePrice : product.base_price;
            const newItem: NewOrderItem = {
                id: crypto.randomUUID(),
                product,
                quantity,
                unitPrice: price,
                totalPrice: price * quantity,
                productItemId
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
        
        if (item) {
            const isDuplicate = items.some(existing => existing.productItemId === item.id);
            if (isDuplicate) {
                toast.warning("Este item já foi adicionado ao pedido!");
                return;
            }

            addItem(selectedProductForSelection, 1, item.id, item.sale_price);
            toast.success(`Item adicionado: ${selectedProductForSelection.name}`);
        } else {
            addItem(selectedProductForSelection, 1, undefined);
            toast.success(`Item agendado: ${selectedProductForSelection.name}`);
        }
        
        setSelectionOpen(false);
        setSelectedProductForSelection(null);
    }, [addItem, selectedProductForSelection, items]);

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

    const prefill = useCallback((data: {
        client?: Client;
        items?: NewOrderItem[];
        scheduledPickup?: Date;
        notes?: string;
        clientName?: string;
        paymentMethod?: string;
        address?: ParsedAddress | null;
    }) => {
        reset();
        if (data.client) setSelectedClient(data.client);
        if (data.items && data.items.length > 0) setItems(data.items);
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
        
        const isDeliveryOrder = !!data.address;

        if (data.address) {
            setIsDelivery(true);
            setManualAddress({
                zipCode: data.address.zipCode,
                street: data.address.street,
                number: data.address.number,
                complement: data.address.complement || "",
                neighborhood: data.address.neighborhood,
                city: data.address.city,
                state: data.address.state
            });
        }

        // Calculate payment amount including delivery fee if applicable
        if (data.paymentMethod) {
            setHasPartialPayment(true);
            const itemsTotal = data.items ? data.items.reduce((sum, i) => sum + i.totalPrice, 0) : 0;
            const paymentAmount = isDeliveryOrder ? itemsTotal + defaultFee : itemsTotal;
            setPaymentEntries([{
                id: crypto.randomUUID(),
                method: data.paymentMethod,
                amount: paymentAmount,
                details: {}
            }]);
        }

        setImportedFields({
            items: !!(data.items && data.items.length > 0),
            scheduledPickup: !!data.scheduledPickup,
            notes: !!(data.notes || data.clientName),
            clientName: !!data.clientName,
            paymentMethod: !!data.paymentMethod,
        });
        
        setIsOpen(true);
    }, [reset, settings?.fixed_delivery_fee]);

    const canSubmit = useMemo(() => {
        if (items.length === 0) return false;
        if (!scheduledPickup) return false;
        if (isDelivery) {
            // Either existing address OR manual address (checks strictly if any manual field is filled or just specific ones?)
            // Let's require at least Street and Number for manual
            if (!deliveryAddressId) {
                 if (!manualAddress.street || !manualAddress.number || !manualAddress.neighborhood) return false;
            }
        }
        return true;
    }, [items, scheduledPickup, isDelivery, deliveryAddressId, manualAddress]);

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
            if (isDelivery && !deliveryAddressId && (!manualAddress.street || !manualAddress.number)) {
                toast.error("Selecione um endereço ou preencha o endereço manual");
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
                delivery_fee: isDelivery ? deliveryFee : 0,
                // Add manual address fields ONLY if deliveryAddressId is NOT set and isDelivery is true
                ...(isDelivery && !deliveryAddressId ? {
                    delivery_zip_code: manualAddress.zipCode,
                    delivery_street: manualAddress.street,
                    delivery_number: manualAddress.number,
                    delivery_complement: manualAddress.complement,
                    delivery_neighborhood: manualAddress.neighborhood,
                    delivery_city: manualAddress.city,
                    delivery_state: manualAddress.state
                } : {})
            };

            // ... (keep existing payment logic)
            // Payments logic remains same...
            
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
        canSubmit, items, scheduledPickup, isDelivery, deliveryAddressId, manualAddress,
        total, selectedClient, notes, deliveryFee, hasPartialPayment,
        paymentEntries, queryClient, close, onSuccess
    ]);

    const saveOrder = useCallback(async () => {
         if (!existingOrderId) {
             return submit();
         }
         
         const saleItems: SaleItem[] = items.map(item => ({
                product_catalog_id: item.product.id,
                product_item_id: item.productItemId || null,
                name: item.product.name,
                unit_price: item.unitPrice,
                quantity: item.quantity,
                total_price: item.totalPrice
            }));

            const saleData: SaleData = {
                total_amount: total,
                client_id: selectedClient?.id || null,
                notes: notes || null,
                scheduled_pickup: scheduledPickup ? scheduledPickup.toISOString() : null,
                is_delivery: isDelivery,
                delivery_address_id: isDelivery ? deliveryAddressId : null,
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
            };

            // ... update logic
            const { error } = await updateOrder({
                saleId: existingOrderId,
                sale: saleData,
                items: saleItems,
                payments: [] 
            });

            if (error) throw error;
            toast.success(`Pedido #${existingDisplayId} atualizado com sucesso!`);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingOrders'] });
            queryClient.invalidateQueries({ queryKey: ['order', existingOrderId] });
            close();
            onSuccess?.();

    }, [existingOrderId, existingDisplayId, submit, items, scheduledPickup, isDelivery, deliveryAddressId, manualAddress, total, selectedClient, notes, deliveryFee, queryClient, close, onSuccess]);


    const editOrder = useCallback((order: any) => {
         reset();
         setExistingOrderId(order.id);
         setExistingDisplayId(order.display_id);
         
         if (order.clients) setSelectedClient(order.clients);
         if (order.scheduled_pickup) setScheduledPickup(new Date(order.scheduled_pickup));
         setNotes(order.notes || "");
         
         if (order.is_delivery) {
             setIsDelivery(true);
             if (order.delivery_address_id) {
                 setDeliveryAddressId(order.delivery_address_id);
             } else {
                 setManualAddress({
                     zipCode: order.delivery_zip_code || "",
                     street: order.delivery_street || "",
                     number: order.delivery_number || "",
                     complement: order.delivery_complement || "",
                     neighborhood: order.delivery_neighborhood || "",
                     city: order.delivery_city || "",
                     state: order.delivery_state || ""
                 });
             }
             setDeliveryFee(order.delivery_fee || 0);
         }
         
         const mappedItems: NewOrderItem[] = order.sale_items?.map((item: any) => ({
             id: crypto.randomUUID(),
             product: item.product_catalog,
             quantity: item.quantity,
             unitPrice: item.unit_price,
             totalPrice: item.total_price,
             productItemId: item.product_item_id
         })) || [];
         
         setItems(mappedItems);
         setIsOpen(true);
    }, [reset]);

    return {
        // ... existing returns
        isOpen, open, close, prefill, items, addItem, updateItemQuantity, removeItem,
        selectedClient, setSelectedClient, scheduledPickup, setScheduledPickup,
        notes, setNotes, isDelivery, setIsDelivery, deliveryAddressId, setDeliveryAddressId,
        deliveryFee, setDeliveryFee, hasPartialPayment, setHasPartialPayment,
        paymentEntries, addPaymentEntry, removePaymentEntry, subtotal, total,
        isSubmitting, canSubmit, submit: saveOrder, reset, editOrder, isEditing: !!existingOrderId,
        existingDisplayId, importedFields, clearImportedFields: () => setImportedFields({ items: false, scheduledPickup: false, notes: false, clientName: false, paymentMethod: false }),
        selectionOpen, setSelectionOpen, selectedProductForSelection, handleProductSelect, handleAddInternalItem,
        
        manualAddress, setManualAddress
    };
}

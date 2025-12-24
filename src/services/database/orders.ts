import { DatabaseResult } from './types';
import { supabase } from '@/integrations/supabase/client';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
    id: string;
    display_id: number;
    total_amount: number;
    scheduled_pickup?: string | null;
    order_status: OrderStatus;
    created_at: string;
    notes?: string | null;
    change_amount?: number;
    clients?: {
        id: string;
        name: string;
        phone?: string;
    } | null;
    sale_items?: {
        id: string;
        name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        product_item_id?: string | null;
        product_catalog?: {
            id: string;
            is_internal: boolean;
            base_price: number;
            catalog_barcode?: number;
            name: string;
        } | null;
    }[];
    sale_payments?: {
        id: string;
        amount: number;
        payment_method: string;
    }[];
    is_delivery: boolean;
    delivery_fee?: number;
    delivery_address_id?: string;
    delivery_zip_code?: string;
    delivery_street?: string;
    delivery_number?: string;
    delivery_complement?: string;
    delivery_neighborhood?: string;
    delivery_city?: string;
    delivery_state?: string;
    client_addresses?: {
        id: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
    } | null;
}

export interface OrderFilters {
    date?: Date;
    dateRange?: { from: Date; to: Date };
    status?: OrderStatus | 'all';
    searchTerm?: string;
}

export const getOrders = async (filters?: OrderFilters): Promise<DatabaseResult<Order[]>> => {
    try {
        let orders: Order[] = [];

        if (filters?.date || filters?.dateRange) {
            // Determine date range
            let startFilterDate: Date;
            let endFilterDate: Date;

            if (filters.dateRange) {
                startFilterDate = new Date(filters.dateRange.from);
                endFilterDate = new Date(filters.dateRange.to);
            } else {
                // Fallback to single date
                startFilterDate = new Date(filters.date!);
                endFilterDate = new Date(filters.date!);
            }

            startFilterDate.setHours(0, 0, 0, 0);
            endFilterDate.setHours(23, 59, 59, 999);
            const now = new Date();

            // 1. Get orders for the specific date range
            const dateQuery = supabase
                .from('sales')
                .select(`
                    id,
                    display_id,
                    total_amount,
                    scheduled_pickup,
                    order_status,
                    created_at,
                    notes,
                    change_amount,
                    clients ( id, name, phone ),
                    sale_items ( 
                        id, name, quantity, unit_price, total_price, product_item_id,
                        product_catalog ( id, is_internal, base_price, catalog_barcode, name )
                    ),
                    sale_payments ( id, amount, payment_method ),
                    is_delivery,
                    delivery_fee,
                    delivery_address_id,
                    delivery_zip_code, delivery_street, delivery_number, delivery_complement, delivery_neighborhood, delivery_city, delivery_state,
                    client_addresses ( id, street, number, complement, neighborhood, city, state, zip_code )
                `)
                .gte('scheduled_pickup', startFilterDate.toISOString())
                .lte('scheduled_pickup', endFilterDate.toISOString());

            // 2. Get delayed orders (scheduled < now AND not delivered/cancelled)
            // We only want to show delayed orders if we are looking at a time range that includes "now" or is in the future.
            // Actually, standard behavior for this app: always show backlog when looking at "current" views.
            const delayedQuery = supabase
                .from('sales')
                .select(`
                    id,
                    display_id,
                    total_amount,
                    scheduled_pickup,
                    order_status,
                    created_at,
                    notes,
                    change_amount,
                    clients ( id, name, phone ),
                    sale_items ( 
                        id, name, quantity, unit_price, total_price, product_item_id,
                        product_catalog ( id, is_internal, base_price, catalog_barcode, name )
                    ),
                    sale_payments ( id, amount, payment_method ),
                    is_delivery,
                    delivery_fee,
                    delivery_address_id,
                    delivery_zip_code, delivery_street, delivery_number, delivery_complement, delivery_neighborhood, delivery_city, delivery_state,
                    client_addresses ( id, street, number, complement, neighborhood, city, state, zip_code )
                `)
                .lt('scheduled_pickup', now.toISOString())
                .neq('order_status', 'delivered')
                .neq('order_status', 'cancelled');

            const [dateResult, delayedResult] = await Promise.all([dateQuery, delayedQuery]);

            if (dateResult.error) throw dateResult.error;
            if (delayedResult.error) throw delayedResult.error;

            // Combine and deduplicate
            const dateOrders = (dateResult.data as unknown as Order[]) || [];
            const delayedOrders = (delayedResult.data as unknown as Order[]) || [];
            
            const map = new Map<string, Order>();
            dateOrders.forEach(o => map.set(o.id, o));
            delayedOrders.forEach(o => map.set(o.id, o));
            
            orders = Array.from(map.values());

        } else {
            // Standard query without date filter
            let query = supabase
                .from('sales')
                .select(`
                    id,
                    display_id,
                    total_amount,
                    scheduled_pickup,
                    order_status,
                    created_at,
                    notes,
                    change_amount,
                    clients ( id, name, phone ),
                    sale_items ( 
                        id, name, quantity, unit_price, total_price, product_item_id,
                        product_catalog ( id, is_internal, base_price, catalog_barcode, name )
                    ),
                    sale_payments ( id, amount, payment_method ),
                    is_delivery,
                    delivery_fee,
                    delivery_address_id,
                    delivery_zip_code, delivery_street, delivery_number, delivery_complement, delivery_neighborhood, delivery_city, delivery_state,
                    client_addresses ( id, street, number, complement, neighborhood, city, state, zip_code )
                `)
                .not('order_status', 'is', null);

            const { data, error } = await query;
            if (error) throw error;
            orders = (data as unknown as Order[]) || [];
            
            // Post-processing filter for delivered orders (only show for today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            orders = orders.filter(order => {
                if (order.order_status === 'delivered') {
                    const createdAt = new Date(order.created_at);
                    return createdAt >= today && createdAt <= endOfToday;
                }
                return true;
            });
        }

        // Apply Search Term
        if (filters?.searchTerm && filters.searchTerm.trim()) {
            const term = filters.searchTerm.toLowerCase().trim();
            orders = orders.filter(order => {
                const displayIdMatch = order.display_id.toString().includes(term);
                const clientNameMatch = order.clients?.name?.toLowerCase().includes(term) || false;
                return displayIdMatch || clientNameMatch;
            });
        }

        // Sort by scheduled_pickup ASC
        orders.sort((a, b) => {
            const dateA = a.scheduled_pickup ? new Date(a.scheduled_pickup).getTime() : 0;
            const dateB = b.scheduled_pickup ? new Date(b.scheduled_pickup).getTime() : 0;
            // If both have dates, sort asc
            if (dateA && dateB) return dateA - dateB;
            // If one missing, put at end
            if (!dateA) return 1;
            if (!dateB) return -1;
            return 0;
        });

        return { data: orders, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const getUpcomingOrders = async (): Promise<DatabaseResult<Order[]>> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('sales')
            .select(`
                id,
                display_id,
                total_amount,
                scheduled_pickup,
                order_status,
                created_at,
                notes,
                clients ( id, name, phone ),
                sale_items ( 
                    id, name, quantity, unit_price, total_price, product_item_id,
                    product_catalog ( id, is_internal, base_price, catalog_barcode, name )
                ),
                sale_payments ( id, amount, payment_method ),
                is_delivery,
                delivery_fee,
                delivery_address_id,
                delivery_zip_code, delivery_street, delivery_number, delivery_complement, delivery_neighborhood, delivery_city, delivery_state,
                client_addresses ( id, street, number, complement, neighborhood, city, state, zip_code )
            `)
            .gte('scheduled_pickup', today.toISOString())
            .lte('scheduled_pickup', threeDaysFromNow.toISOString())
            .not('order_status', 'eq', 'delivered')
            .not('order_status', 'eq', 'cancelled')
            .order('scheduled_pickup', { ascending: true });

        if (error) throw error;

        return { data: (data as unknown as Order[]) || [], error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const updateOrderStatus = async (
    saleId: string, 
    orderStatus: OrderStatus
): Promise<DatabaseResult<{ success: boolean }>> => {
    try {
        const { data, error } = await supabase.rpc('update_order_status', {
            p_sale_id: saleId,
            p_order_status: orderStatus
        });

        if (error) throw error;

        return { data: data as { success: boolean }, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const linkProductItemToSaleItem = async (
    saleItemId: string,
    productItemId: string
): Promise<DatabaseResult<void>> => {
    try {
        // 1. Update sale_item with product_item_id
        const { error: saleItemError } = await supabase
            .from('sale_items')
            .update({ product_item_id: productItemId })
            .eq('id', saleItemId);

        if (saleItemError) throw saleItemError;

        // 2. Update product_item status to 'sold' (and ideally link to sale, but sale_id is on header... 
        // actually product_item also has sale_id. We should fetch the sale_id from sale_item parent...
        // For now, let's just mark as sold. A perfect implementation would link sale_id too.
        // Let's first get the sale_item to know the sale_id
        const { data: saleItemData, error: fetchError } = await supabase
            .from('sale_items')
            .select('sale_id')
            .eq('id', saleItemId)
            .single();
            
        if (fetchError) throw fetchError;
        
        const { error: productItemError } = await supabase
            .from('product_item')
            .update({ 
                status: 'sold',
                sold_at: new Date().toISOString(),
                sale_id: saleItemData.sale_id
            })
            .eq('id', productItemId);

        if (productItemError) throw productItemError;

        return { data: null, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const checkAndSetOrderReady = async (
    saleId: string
): Promise<DatabaseResult<boolean>> => {
    try {
        // Get all items for this sale
        const { data: items, error } = await supabase
            .from('sale_items')
            .select('id, product_item_id, product_catalog (is_internal)')
            .eq('sale_id', saleId);

        if (error) throw error;
        
        if (!items || items.length === 0) return { data: false, error: null };

        // Check if all internal items have a linked product_item_id
        // (External products don't have product_item_id usually, or at least we focusing on internal ones)
        // Actually, we should check if all items that SHOULD be linked are linked.
        // For simplicity: if all items have product_item_id OR aren't internal (maybe?)
        // Let's assume strict check: all items in the order must have product_item_id if they are internal.
        
        const allLinked = items.every((item: any) => {
            // If it's internal, it must have product_item_id
            if (item.product_catalog?.is_internal) {
                return !!item.product_item_id;
            }
            return true; // Non-internal items don't need linking (or apply different logic)
        });

        if (allLinked) {
            await updateOrderStatus(saleId, 'ready');
            return { data: true, error: null };
        }

        return { data: false, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    received: 'Recebido',
    preparing: 'Em Preparo',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
    received: 'bg-blue-100 text-blue-800 border-blue-200',
    preparing: 'bg-amber-100 text-amber-800 border-amber-200',
    ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    delivered: 'bg-primary/20 text-primary border-primary/30',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
};

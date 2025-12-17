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
    }[];
    sale_payments?: {
        id: string;
        amount: number;
        payment_method: string;
    }[];
}

export interface OrderFilters {
    date?: Date;
    status?: OrderStatus | 'all';
    searchTerm?: string;
}

export const getOrders = async (filters?: OrderFilters): Promise<DatabaseResult<Order[]>> => {
    try {
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
                sale_items ( id, name, quantity, unit_price, total_price ),
                sale_payments ( id, amount, payment_method )
            `)
            .not('order_status', 'is', null)
            .order('scheduled_pickup', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (filters?.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query = query
                .gte('scheduled_pickup', startOfDay.toISOString())
                .lte('scheduled_pickup', endOfDay.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        let orders = (data as unknown as Order[]) || [];

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

        if (filters?.searchTerm && filters.searchTerm.trim()) {
            const term = filters.searchTerm.toLowerCase().trim();
            orders = orders.filter(order => {
                const displayIdMatch = order.display_id.toString().includes(term);
                const clientNameMatch = order.clients?.name?.toLowerCase().includes(term) || false;
                return displayIdMatch || clientNameMatch;
            });
        }

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
                sale_items ( id, name, quantity, unit_price, total_price ),
                sale_payments ( id, amount, payment_method )
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

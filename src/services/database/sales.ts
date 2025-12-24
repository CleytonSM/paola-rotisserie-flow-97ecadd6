import { DatabaseResult } from './types';
import { supabase } from '@/integrations/supabase/client';

export interface SalePayment {
    amount: number;
    payment_method: 'pix' | 'cash' | 'card_credit' | 'card_debit';
    pix_key_id?: string;
    machine_id?: string;
    card_flag?: string;
    installments?: number;
}

export interface SaleItem {
    product_catalog_id: string;
    product_item_id?: string | null;
    name: string;
    unit_price: number;
    quantity: number;
    total_price: number;
}

export interface SaleData {
    total_amount: number;
    client_id?: string | null;
    notes?: string | null;
    change_amount?: number;
    scheduled_pickup?: string | null;
    is_delivery?: boolean;
    delivery_address_id?: string | null;
    delivery_fee?: number;
    delivery_zip_code?: string;
    delivery_street?: string;
    delivery_number?: string;
    delivery_complement?: string;
    delivery_neighborhood?: string;
    delivery_city?: string;
    delivery_state?: string;
}

export interface CompleteSaleParams {
    sale: SaleData;
    items: SaleItem[];
    payments: SalePayment[];
}

export interface CompleteSaleResult {
    sale_id: string;
    display_id: number;
}

export const completeSale = async (
    params: CompleteSaleParams
): Promise<DatabaseResult<CompleteSaleResult>> => {
    try {
        const { data, error } = await supabase.rpc('complete_sale', {
            p_sale_data: params.sale,
            p_items_data: params.items,
            p_payments_data: params.payments
        });

        if (error) throw error;

        return { data: data as CompleteSaleResult, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export interface AddPaymentParams {
    saleId: string;
    amount: number;
    paymentMethod: string;
    pixKeyId?: string;
    machineId?: string;
    cardFlag?: string;
    installments?: number;
}

export const addPaymentToOrder = async (
    params: AddPaymentParams
): Promise<DatabaseResult<{ success: boolean; payment_id: string }>> => {
    try {
        const { data, error } = await supabase.rpc('add_payment_to_order', {
            p_sale_id: params.saleId,
            p_amount: params.amount,
            p_payment_method: params.paymentMethod,
            p_pix_key_id: params.pixKeyId || null,
            p_machine_id: params.machineId || null,
            p_card_flag: params.cardFlag || null,
            p_installments: params.installments || 1
        });

        if (error) throw error;

        return { data: data as { success: boolean; payment_id: string }, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const deleteOrder = async (
    saleId: string
): Promise<DatabaseResult<{ success: boolean }>> => {
    try {
        const { data, error } = await supabase.rpc('delete_order', {
            p_sale_id: saleId
        });

        if (error) throw error;

        return { data: data as { success: boolean }, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const updateOrder = async (
    params: CompleteSaleParams & { saleId: string }
): Promise<DatabaseResult<{ success: boolean }>> => {
    try {
        const { data, error } = await supabase.rpc('update_order', {
            p_sale_id: params.saleId,
            p_sale_data: params.sale,
            p_items_data: params.items
        });

        if (error) throw error;

        return { data: data as { success: boolean }, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

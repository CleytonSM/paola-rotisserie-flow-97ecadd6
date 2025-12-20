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

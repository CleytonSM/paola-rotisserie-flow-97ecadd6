
import { DatabaseQuery, DatabaseMutation } from './types';
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
    notes?: string;
    change_amount?: number;
}

export interface CompleteSaleParams {
    sale: SaleData;
    items: SaleItem[];
    payments: SalePayment[];
}

export const completeSale = async (params: CompleteSaleParams): Promise<{ data: { sale_id: string, display_id: number } | null, error: Error | null }> => {
    try {
        const { data, error } = await supabase.rpc('complete_sale', {
            p_sale_data: params.sale,
            p_items_data: params.items,
            p_payments_data: params.payments
        });

        if (error) throw error;

        return { data: data as any, error: null };
    } catch (error: any) {
        console.error('Error completing sale:', error);
        return { data: null, error: error };
    }
};

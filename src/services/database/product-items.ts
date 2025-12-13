import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";
import type { ProductCatalog } from "./product-catalog";

export type ProductItemStatus = 'available' | 'sold' | 'reserved' | 'expired' | 'discarded';

export interface ProductItem {
    id: string;
    catalog_id: string;
    scale_barcode: number;
    produced_at: string;
    expires_at: string;
    weight_kg: number;
    sale_price: number;
    item_discount?: number | null;
    status: ProductItemStatus;
    sold_at?: string | null;
    sale_id?: string | null;
    created_at?: string;
    updated_at?: string;
    product_catalog?: ProductCatalog;
}

export interface ProductItemInput {
    catalog_id: string;
    scale_barcode: number;
    produced_at?: string;
    weight_kg: number;
    sale_price: number;
    item_discount?: number | null;
    status?: ProductItemStatus;
}

export interface ProductItemFilters {
    status?: ProductItemStatus;
    catalog_id?: string;
    expiring_within_days?: number;
    searchTerm?: string;
    productionDateFrom?: string;
    productionDateTo?: string;
    expirationPreset?: 'today' | 'tomorrow' | '3days' | '7days' | 'expired' | 'all';
}

const applyExpirationFilter = (query: any, preset: ProductItemFilters['expirationPreset']) => {
    if (!preset || preset === 'all') return query;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    switch (preset) {
        case 'today':
            return query.gte("expires_at", today.toISOString()).lte("expires_at", endOfToday.toISOString());
        case 'tomorrow':
            return query.gte("expires_at", tomorrow.toISOString()).lte("expires_at", endOfTomorrow.toISOString());
        case '3days': {
            const in3Days = new Date(today);
            in3Days.setDate(in3Days.getDate() + 3);
            in3Days.setHours(23, 59, 59, 999);
            return query.gte("expires_at", today.toISOString()).lte("expires_at", in3Days.toISOString());
        }
        case '7days': {
            const in7Days = new Date(today);
            in7Days.setDate(in7Days.getDate() + 7);
            in7Days.setHours(23, 59, 59, 999);
            return query.gte("expires_at", today.toISOString()).lte("expires_at", in7Days.toISOString());
        }
        case 'expired':
            return query.lt("expires_at", now.toISOString());
        default:
            return query;
    }
};

export const getProductItems = async (
    filters?: ProductItemFilters,
    page: number = 1,
    pageSize: number = 100
): Promise<DatabaseResult<ProductItem[]>> => {
    try {
        let query = supabase
            .from("product_item")
            .select(`*, product_catalog!inner (name, catalog_barcode)`, { count: 'exact' })
            .order("produced_at", { ascending: false });

        if (filters?.status) query = query.eq("status", filters.status);
        if (filters?.catalog_id) query = query.eq("catalog_id", filters.catalog_id);

        if (filters?.searchTerm?.trim()) {
            const term = filters.searchTerm.trim();
            if (/^\d+$/.test(term)) {
                query = query.or(`scale_barcode.eq.${term},product_catalog.catalog_barcode.eq.${term}`);
            } else {
                query = query.ilike("product_catalog.name", `%${term}%`);
            }
        }

        if (filters?.productionDateFrom) query = query.gte("produced_at", filters.productionDateFrom);
        if (filters?.productionDateTo) {
            const endDate = new Date(filters.productionDateTo);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte("produced_at", endDate.toISOString());
        }

        query = applyExpirationFilter(query, filters?.expirationPreset);

        if (filters?.expiring_within_days) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + filters.expiring_within_days);
            query = query.lte("expires_at", expiryDate.toISOString()).eq("status", "available");
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;
        return { data: data as unknown as ProductItem[], error: null, count };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const getProductItemByBarcode = async (barcode: number): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .select(`*, product_catalog (*)`)
            .eq('scale_barcode', barcode)
            .eq('status', 'available')
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return { data: data as ProductItem, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const createProductItem = async (item: ProductItemInput): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .insert([{
                ...item,
                status: item.status || 'available',
                produced_at: item.produced_at || new Date().toISOString(),
            }])
            .select(`*, product_catalog (*)`)
            .single();

        if (error) throw error;
        return { data: data as ProductItem, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const updateProductItem = async (id: string, item: Partial<ProductItemInput>): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .update(item)
            .eq("id", id)
            .select(`*, product_catalog (*)`)
            .single();

        if (error) throw error;
        return { data: data as ProductItem, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const deleteProductItem = async (id: string): Promise<DatabaseResult<void>> => {
    try {
        const { error } = await supabase.from("product_item").delete().eq("id", id);
        if (error) throw error;
        return { data: null, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const markItemAsSold = async (id: string, sale_id?: string): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .update({
                status: 'sold',
                sold_at: new Date().toISOString(),
                sale_id: sale_id || null,
            })
            .eq("id", id)
            .select(`*, product_catalog (*)`)
            .single();

        if (error) throw error;
        return { data: data as ProductItem, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const getExpiringItems = async (days: number = 3): Promise<DatabaseResult<ProductItem[]>> => {
    return getProductItems({ expiring_within_days: days });
};

export const markExpiredItems = async (): Promise<DatabaseResult<number>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .update({ status: 'expired' })
            .lt("expires_at", new Date().toISOString())
            .eq("status", "available")
            .select("id");

        if (error) throw error;
        return { data: data?.length || 0, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

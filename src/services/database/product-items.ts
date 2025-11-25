/**
 * Product Items database operations
 * Handles CRUD operations for the product_item table (individual weighed items)
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";
import type { ProductCatalog } from "./product-catalog";

export type ProductItemStatus = 'available' | 'sold' | 'reserved' | 'expired' | 'discarded';

export interface ProductItem {
    id: string;
    catalog_id: string;
    scale_barcode: number;
    produced_at: string;
    expires_at: string;  // auto-calculated by database trigger
    weight_kg: number;
    sale_price: number;
    item_discount?: number | null;  // 0-1 range
    status: ProductItemStatus;
    sold_at?: string | null;
    sale_id?: string | null;
    created_at?: string;
    updated_at?: string;
    // Joined data from catalog
    product_catalog?: ProductCatalog;
}

export interface ProductItemInput {
    catalog_id: string;
    scale_barcode: number;
    produced_at?: string;  // defaults to NOW() in database
    weight_kg: number;
    sale_price: number;
    item_discount?: number | null;
    status?: ProductItemStatus;
}

export interface ProductItemFilters {
    status?: ProductItemStatus;
    catalog_id?: string;
    expiring_within_days?: number;
}

/**
 * Get all product items with optional filters
 */
export const getProductItems = async (
    filters?: ProductItemFilters
): Promise<DatabaseResult<ProductItem[]>> => {
    try {
        let query = supabase
            .from("product_item")
            .select(`
        *,
        product_catalog (*)
      `)
            .order("produced_at", { ascending: false });

        if (filters?.status) {
            query = query.eq("status", filters.status);
        }

        if (filters?.catalog_id) {
            query = query.eq("catalog_id", filters.catalog_id);
        }

        if (filters?.expiring_within_days) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + filters.expiring_within_days);
            query = query
                .lte("expires_at", expiryDate.toISOString())
                .eq("status", "available");
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Create a new product item
 * Note: expires_at will be auto-calculated by the database trigger
 */
export const createProductItem = async (
    item: ProductItemInput
): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .insert([{
                ...item,
                status: item.status || 'available',
                produced_at: item.produced_at || new Date().toISOString(),
            }])
            .select(`
        *,
        product_catalog (*)
      `)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Update an existing product item
 */
export const updateProductItem = async (
    id: string,
    item: Partial<ProductItemInput>
): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .update(item)
            .eq("id", id)
            .select(`
        *,
        product_catalog (*)
      `)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Delete a product item
 */
export const deleteProductItem = async (
    id: string
): Promise<DatabaseResult<void>> => {
    try {
        const { error } = await supabase
            .from("product_item")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return { data: null, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Mark an item as sold
 */
export const markItemAsSold = async (
    id: string,
    sale_id?: string
): Promise<DatabaseResult<ProductItem>> => {
    try {
        const { data, error } = await supabase
            .from("product_item")
            .update({
                status: 'sold',
                sold_at: new Date().toISOString(),
                sale_id: sale_id || null,
            })
            .eq("id", id)
            .select(`
        *,
        product_catalog (*)
      `)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Get items expiring within specified days
 */
export const getExpiringItems = async (
    days: number = 3
): Promise<DatabaseResult<ProductItem[]>> => {
    return getProductItems({ expiring_within_days: days });
};

/**
 * Update status for expired items (run periodically)
 */
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

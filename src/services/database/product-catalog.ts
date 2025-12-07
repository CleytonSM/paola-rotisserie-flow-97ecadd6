/**
 * Product Catalog database operations
 * Handles CRUD operations for the product_catalog table (master product templates)
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export interface ProductCatalog {
    id: string;
    name: string;
    base_price: number;  // price per kg or per unit
    internal_code?: string | null;
    catalog_barcode?: number | null;
    shelf_life_days?: number | null;
    default_discount?: number | null;  // 0-1 range
    unit_type: 'kg' | 'un';
    is_internal: boolean;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProductCatalogInput {
    name: string;
    base_price: number;
    internal_code?: string | null;
    catalog_barcode?: number | null;
    shelf_life_days: number;
    default_discount?: number | null;
    unit_type?: 'kg' | 'un';
    is_internal?: boolean;
    is_active?: boolean;
}

/**
 * Get all product catalog items
 * @param activeOnly - If true, only return active products (default: true)
 */
export const getProductCatalog = async (
    activeOnly: boolean = true
): Promise<DatabaseResult<ProductCatalog[]>> => {
    try {
        let query = supabase
            .from("product_catalog")
            .select("*")
            .order("name", { ascending: true });

        if (activeOnly) {
            query = query.eq("is_active", true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Create a new product catalog item
 */
export const createCatalogProduct = async (
    product: ProductCatalogInput
): Promise<DatabaseResult<ProductCatalog>> => {
    try {
        const { data, error } = await supabase
            .from("product_catalog")
            .insert([{ ...product, is_active: product.is_active ?? true }])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Update an existing product catalog item
 */
export const updateCatalogProduct = async (
    id: string,
    product: ProductCatalogInput
): Promise<DatabaseResult<ProductCatalog>> => {
    try {
        const { data, error } = await supabase
            .from("product_catalog")
            .update(product)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Soft delete a product catalog item (set is_active = false)
 */
export const deleteCatalogProduct = async (
    id: string
): Promise<DatabaseResult<void>> => {
    try {
        const { error } = await supabase
            .from("product_catalog")
            .update({ is_active: false })
            .eq("id", id);

        if (error) throw error;
        return { data: null, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Hard delete a product catalog item (permanent deletion)
 * Use with caution - this will fail if there are related product_items
 */
export const hardDeleteCatalogProduct = async (
    id: string
): Promise<DatabaseResult<void>> => {
    try {
        const { error } = await supabase
            .from("product_catalog")
            .delete()
            .eq("id", id);

        if (error) throw error;
        return { data: null, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Search product catalog by code (barcode or internal) or name
 */
export const searchProductCatalog = async (
    query: string
): Promise<DatabaseResult<ProductCatalog[]>> => {
    try {
        // If query is short, don't search
        if (query.length < 3) return { data: [], error: null };

        // Check if query is numeric (potential barcode)
        const isNumeric = /^\d+$/.test(query);

        let dbQuery = supabase
            .from("product_catalog")
            .select("*")
            .eq("is_active", true);

        if (isNumeric) {
            // Search by barcode or internal code
            dbQuery = dbQuery.or(`catalog_barcode.eq.${query},internal_code.eq.${query}`);
        } else {
            // Search by name (case insensitive) or internal code
            dbQuery = dbQuery.or(`name.ilike.%${query}%,internal_code.ilike.%${query}%`);
        }
        
        const { data, error } = await dbQuery.limit(20);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

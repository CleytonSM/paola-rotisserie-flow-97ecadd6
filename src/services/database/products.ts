/**
 * Products database operations
 * Handles CRUD operations for the products table
 */


import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export interface Product {
    id: string;
    name: string;
    shelf_life_days?: number | null;
    catalog_barcode?: number | null;
    base_price: number;
    internal_code?: string | null;
    default_discount?: number | null;
    is_active?: boolean | null;
    created_at?: string;
    updated_at?: string;
}   

export interface ProductInput {
    name: string;
    shelf_life_days?: number | null;
    barcode?: number | null;
    price: number;
    code?: string | null;
    discount?: number | null;
}



/**
 * Get all products
 */
export const getProducts = async (): Promise<DatabaseResult<Product[]>> => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Create a new product
 */
export const createProduct = async (
    product: ProductInput
): Promise<DatabaseResult<Product>> => {
    try {
        const { data, error } = await supabase
            .from("products")
            .insert([product])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Update an existing product
 */
export const updateProduct = async (
    id: string,
    product: ProductInput
): Promise<DatabaseResult<Product>> => {
    try {
        const { data, error } = await supabase
            .from("products")
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
 * Delete a product
 */
export const deleteProduct = async (
    id: string
): Promise<DatabaseResult<void>> => {
    try {
        const { error } = await supabase.from("products").delete().eq("id", id);

        if (error) throw error;
        return { data: null, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Search products by code (barcode or internal) or name
 */
export const getProductsByCodeOrName = async (
    query: string
): Promise<DatabaseResult<Product[]>> => {
    try {
        // If query is short, don't search
        if (query.length < 3) return { data: [], error: null };

        // Check if query is numeric (potential barcode)
        const isNumeric = /^\d+$/.test(query);

        let dbQuery = supabase
            .from("products")
            .select("*")
            .eq("is_active", true);

        if (isNumeric) {
            // Search by barcode
            dbQuery = dbQuery.or(`catalog_barcode.eq.${query}`);
        } else {
            // Search by name (case insensitive)
            dbQuery = dbQuery.or(`name.ilike.%${query}%`);
        }
        
        const { data, error } = await dbQuery.limit(20);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

/**
 * Product Catalog database operations
 * Handles CRUD operations for the product_catalog table (master product templates)
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export interface ProductCatalog {
    id: string;
    name: string;
    base_price: number;
    catalog_barcode?: number | null;
    shelf_life_days?: number | null;
    default_discount?: number | null;
    unit_type: 'kg' | 'un';
    is_internal: boolean;
    quantity?: number | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProductCatalogInput {
    name: string;
    base_price: number;
    catalog_barcode?: number | null;
    shelf_life_days: number;
    default_discount?: number | null;
    unit_type?: 'kg' | 'un';
    is_internal?: boolean;
    quantity?: number | null;
    is_active?: boolean;
}

export const getProductCatalog = async (
    activeOnly: boolean = true,
    searchTerm: string = "",
    page: number = 1,
    pageSize: number = 100
): Promise<DatabaseResult<ProductCatalog[]>> => {
    try {
        let query = supabase
            .from("product_catalog")
            .select("*", { count: "exact" })
            .order("name", { ascending: true });

        if (activeOnly) {
            query = query.eq("is_active", true);
        }

        if (searchTerm) {
            query = query.ilike("name", `%${searchTerm}%`);
        }

        const { data, error, count } = await query
            .range((page - 1) * pageSize, page * pageSize - 1)
            .limit(pageSize);

        if (error) throw error;
        return { data, error: null, count: count ?? 0 };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const getProductCatalogList = async (
    activeOnly: boolean = true,
    searchTerm: string = "",
    page: number = 1,
    pageSize: number = 100
): Promise<DatabaseResult<ProductCatalog[]>> => {
    try {
        let query = supabase
            .from("product_catalog")
            .select(`
                id,
                name,
                base_price,
                unit_type,
                is_internal,
                is_active,
                quantity,
                catalog_barcode,
                shelf_life_days,
                default_discount,
                created_at,
                updated_at
            `, { count: "exact" })
            .order("name", { ascending: true });

        if (activeOnly) {
            query = query.eq("is_active", true);
        }

        if (searchTerm) {
            query = query.ilike("name", `%${searchTerm}%`);
        }

        const { data, error, count } = await query
            .range((page - 1) * pageSize, page * pageSize - 1)
            .limit(pageSize);

        if (error) throw error;
        return { data, error: null, count: count ?? 0 };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const getProductCatalogById = async (id: string): Promise<DatabaseResult<ProductCatalog>> => {
    try {
        const { data, error } = await supabase
            .from("product_catalog")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

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

export const getInternalActiveCatalogProducts = async (): Promise<DatabaseResult<ProductCatalog[]>> => {
    try {
        const { data, error } = await supabase
            .from("product_catalog")
            .select("*")
            .eq("is_internal", true)
            .eq("is_active", true)
            .order("name", { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

export const searchProductCatalog = async (
    query: string
): Promise<DatabaseResult<ProductCatalog[]>> => {
    try {
        const isNumeric = /^\d+$/.test(query);

        let dbQuery = supabase
            .from("product_catalog")
            .select("*")
            .eq("is_active", true);

        if (isNumeric) {
            dbQuery = dbQuery.eq('catalog_barcode', query);
        } else {
            dbQuery = dbQuery.ilike('name', `%${query}%`);
        }

        const { data, error } = await dbQuery.limit(20);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error: error as Error };
    }
};

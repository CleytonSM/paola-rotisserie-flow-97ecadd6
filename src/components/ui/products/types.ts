/**
 * Product Catalog types and interfaces
 */

export interface ProductCatalog {
    id: string;
    name: string;
    base_price: number;
    internal_code?: string | null;
    catalog_barcode?: number | null;
    shelf_life_days?: number | null;
    default_discount?: number | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface FormData {
    name: string;
    base_price: string;
    internal_code: string;
    catalog_barcode: string;
    shelf_life_days: string;
    default_discount: string;
    is_active: boolean;
}

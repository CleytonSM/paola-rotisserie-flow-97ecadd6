/**
 * Product types and interfaces
 */

export interface Product {
    id: string;
    name: string;
    shelf_life_days?: number | null;
    barcode?: number | null;
    price: number;
    code?: string | null;
    discount?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface FormData {
    name: string;
    shelf_life_days: string;
    barcode: string;
    price: string;
    code: string;
    discount: string;
}

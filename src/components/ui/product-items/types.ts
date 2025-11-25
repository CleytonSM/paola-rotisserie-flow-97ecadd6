/**
 * Product Items types and interfaces
 */

import type { ProductCatalog } from "../products/types";

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

export interface FormData {
    catalog_id: string;
    scale_barcode: string;
    weight_kg: string;
    sale_price: string;
    item_discount: string;
    produced_at: string;
    status: ProductItemStatus;
}

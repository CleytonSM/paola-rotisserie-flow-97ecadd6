import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export interface StockSummary {
  catalog_id: string;
  catalog_name: string;
  total_items: number;
  available_valid: number;
  available_expired: number;
}

/**
 * Get stock summary for a single catalog product
 */
export const getProductCatalogStock = async (
  catalogId: string
): Promise<DatabaseResult<StockSummary>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_product_catalog_stock', { catalog_id: catalogId })
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

/**
 * Get stock summaries for multiple catalog products in a single query
 * This is more efficient than calling getProductCatalogStock multiple times
 * @param catalogIds - Array of catalog product IDs
 */
export const getAllCatalogStocks = async (
  catalogIds: string[]
): Promise<DatabaseResult<StockSummary[]>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_catalog_stocks', { catalog_ids: catalogIds });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};
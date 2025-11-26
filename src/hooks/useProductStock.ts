import { useState, useEffect } from "react";
import { getProductCatalogStock, getAllCatalogStocks, type StockSummary } from "@/services/database";

interface UseProductStockOptions {
    catalogIds?: string[];
    autoLoad?: boolean;
}

/**
 * Custom hook to manage product stock summaries
 * Loads and caches stock data on demand or in batch
 * 
 * @param options.catalogIds - Array of catalog IDs to auto-load
 * @param options.autoLoad - Whether to automatically load all stocks on mount
 */
export const useProductStock = (options?: UseProductStockOptions) => {
    const [stockSummaries, setStockSummaries] = useState<Record<string, StockSummary>>({});
    const [loadingStock, setLoadingStock] = useState<Record<string, boolean>>({});
    const [isLoadingAll, setIsLoadingAll] = useState(false);

    /**
     * Load stock summary for a specific catalog product
     * Results are cached in state
     */
    const loadStockSummary = async (catalogId: string) => {
        setLoadingStock(prev => ({ ...prev, [catalogId]: true }));
        const result = await getProductCatalogStock(catalogId);
        if (result.data) {
            setStockSummaries(prev => ({ ...prev, [catalogId]: result.data! }));
        }
        setLoadingStock(prev => ({ ...prev, [catalogId]: false }));
    };

    /**
     * Load stock summaries for multiple catalog products in a single query
     * This is more efficient than calling loadStockSummary multiple times
     * @param catalogIds - Array of catalog product IDs
     */
    const loadAllStockSummaries = async (catalogIds: string[]) => {
        if (catalogIds.length === 0) return;

        setIsLoadingAll(true);
        const result = await getAllCatalogStocks(catalogIds);

        if (result.data) {
            // Convert array to record keyed by catalog_id
            const summariesMap = result.data.reduce((acc, summary) => {
                acc[summary.catalog_id] = summary;
                return acc;
            }, {} as Record<string, StockSummary>);

            setStockSummaries(summariesMap);
        }

        setIsLoadingAll(false);
    };

    // Auto-load effect
    useEffect(() => {
        if (options?.autoLoad && options.catalogIds && options.catalogIds.length > 0) {
            loadAllStockSummaries(options.catalogIds);
        }
    }, [options?.autoLoad, options?.catalogIds?.join(',')]);

    return {
        stockSummaries,
        loadingStock,
        isLoadingAll,
        loadStockSummary,
        loadAllStockSummaries,
    };
};

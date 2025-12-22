import { Search, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCatalog } from "@/services/database/product-catalog";
import { formatCurrency } from "@/utils/format";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { parseBarcode } from "@/utils/barcode";
import { getProductItemByBarcode, ProductItem } from "@/services/database/product-items";
import { cn } from "@/lib/utils";

// Helper to check if an external product is out of stock
const isOutOfStock = (product: ProductCatalog): boolean => {
    return !product.is_internal && (product.quantity ?? 0) <= 0;
};

interface PDVSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: ProductCatalog[];
    showPreview: boolean;
    setShowPreview: (show: boolean) => void;
    handleProductSelect: (product: ProductCatalog) => void;
    handleButtonClick: () => void;
    isMobile: boolean;
    searchContainerRef: React.RefObject<HTMLDivElement>;
    performSearch: (query: string) => void;
    handleScannedProduct?: (product: ProductCatalog, overridePrice?: number, rawBarcode?: string) => void;
    handleInternalItemSelect?: (item: ProductItem) => void;
}

export function PDVSearch({
    searchQuery,
    setSearchQuery,
    searchResults,
    showPreview,
    setShowPreview,
    handleProductSelect,
    handleButtonClick,
    isMobile,
    searchContainerRef,
    performSearch,
    handleScannedProduct,
    handleInternalItemSelect
}: PDVSearchProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleScan = useCallback(async (barcode: string) => {
        // Animate
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);

        const parsed = parseBarcode(barcode);

        if (parsed.type === 'scale') {
            const { data: item, error } = await getProductItemByBarcode(Number(barcode));

            if (item && handleInternalItemSelect) {
                if (item.status !== 'available') {
                    const statusMessages: Record<string, string> = {
                        'sold': 'Este item já foi vendido.',
                        'reserved': 'Este item está reservado.',
                        'expired': 'Este item está vencido.',
                        'discarded': 'Este item foi descartado.'
                    };
                    const msg = statusMessages[item.status] || `Item indisponível (Status: ${item.status})`;
                    toast.error(msg);
                    setSearchQuery(barcode);
                    setIsAnimating(false);
                    return;
                }

                handleInternalItemSelect(item);
                setIsAnimating(false);
            } else {
                toast.error("Item não encontrado no sistema (Código EAN específico).");
                setSearchQuery(barcode);
                setIsAnimating(false);
            }
        } else {
            setSearchQuery(barcode);
            performSearch(barcode);
        }
    }, [performSearch, setSearchQuery, handleInternalItemSelect]);

    useBarcodeScanner({
        onScan: handleScan,
        minLength: 5
    });

    // Auto-select effect
    useEffect(() => {
        if (isAnimating && searchResults.length > 0) {
            // Check if we just scanned a scale barcode
            const parsed = parseBarcode(searchQuery);

            let match = searchResults.find(p =>
                p.name.toLowerCase() === searchQuery.toLowerCase()
            );

            if (!match && parsed.type === 'scale') {
                // Check if any result confirms the ID match (by catalog_barcode)
                match = searchResults.find(p => String(p.catalog_barcode).padStart(7, '0') === parsed.productId.padStart(7, '0') || String(p.catalog_barcode) === parsed.productId);
            }

            if (match) {
                const overridePrice = parsed.type === 'scale' ? parsed.value : undefined;

                if (parsed.type === 'scale' && handleScannedProduct) {
                    handleScannedProduct(match, overridePrice, searchQuery);
                } else {
                    handleProductSelect(match);
                }

                setIsAnimating(false);
            } else if (searchResults.length === 1 && parsed.type !== 'scale') {
                handleProductSelect(searchResults[0]);
                setIsAnimating(false);
                toast.success(`Scanning: ${searchResults[0].name}`);
            }
        }
    }, [searchResults, isAnimating, searchQuery, handleProductSelect, handleScannedProduct]);

    return (
        <div className="px-6 pt-6 pb-2">
            <div className="relative flex gap-2 max-w-3xl mx-auto" ref={searchContainerRef}>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        className={`pl-12 h-14 text-lg shadow-sm border-border focus:border-primary focus:ring-primary/20 rounded-xl bg-card transition-colors duration-300 ${isAnimating ? 'border-green-500 ring-2 ring-green-500/20' : ''}`}
                        placeholder="Escaneie o código ou digite o nome do produto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                            if (searchResults.length > 0) setShowPreview(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchResults.length > 0) {
                                    handleProductSelect(searchResults[0]);
                                } else {
                                    performSearch(searchQuery);
                                }
                            }
                        }}
                        autoFocus
                    />

                    <AnimatePresence>
                        {showPreview && searchResults.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border max-h-80 overflow-y-auto z-50 overflow-hidden"
                            >
                                {searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 cursor-pointer transition-colors border-b border-border last:border-0",
                                            isOutOfStock(product)
                                                ? "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
                                                : "hover:bg-accent"
                                        )}
                                        onClick={() => {
                                            if (isOutOfStock(product)) {
                                                toast.error(`Produto sem estoque: ${product.name}`);
                                                return;
                                            }
                                            handleProductSelect(product);
                                        }}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-foreground">{product.name}</span>
                                            <span className="text-xs text-muted-foreground flex gap-2">
                                                {product.catalog_barcode && (
                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                                        {product.catalog_barcode}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <span className="font-bold text-primary">
                                            {formatCurrency(product.base_price)}
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <Button
                    size="icon"
                    className="h-14 w-14 bg-primary hover:bg-primary/90 shadow-sm rounded-xl text-white flex-shrink-0"
                    onClick={handleButtonClick}
                >
                    {isMobile ? <ScanBarcode className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    );
}

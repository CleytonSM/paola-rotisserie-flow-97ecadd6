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
        console.log("Scanned barcode:", barcode);
        // Animate
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);

        // Smart parse check
        const parsed = parseBarcode(barcode);

        if (parsed.type === 'scale') {
            // STRICT MATCH: Search for this specific item in DB
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

                // Found specific item -> Add it directly
                handleInternalItemSelect(item);
                setIsAnimating(false);
            } else {
                // Not found or Error
                toast.error("Item não encontrado no sistema (Código EAN específico).");
                setSearchQuery(barcode); // Just show the code
                setIsAnimating(false);
            }
        } else {
            // Generic product -> Standard search
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

            // Standard exact match logic or Smart Match
            let match = searchResults.find(p =>
                p.name.toLowerCase() === searchQuery.toLowerCase()
            );

            // If not direct match, check for scale ID match
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
                        className={`pl-12 h-14 text-lg shadow-sm border-border focus:border-primary focus:ring-primary/20 rounded-xl bg-white transition-colors duration-300 ${isAnimating ? 'border-green-500 ring-2 ring-green-500/20' : ''}`}
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
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50 overflow-hidden"
                            >
                                {searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between p-3 hover:bg-primary-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                        onClick={() => handleProductSelect(product)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-gray-800">{product.name}</span>
                                            <span className="text-xs text-gray-500 flex gap-2">
                                                {/* Barcode display if exists */}
                                                {product.catalog_barcode && (
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                                        {product.catalog_barcode}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <span className="font-bold text-primary-600">
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

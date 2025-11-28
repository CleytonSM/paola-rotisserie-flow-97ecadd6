import { Search, ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCatalog } from "@/services/database/product-catalog";
import { formatCurrency } from "@/utils/format";

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
    performSearch
}: PDVSearchProps) {
    return (
        <div className="px-6 pt-6 pb-2">
            <div className="relative flex gap-2 max-w-3xl mx-auto" ref={searchContainerRef}>
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        className="pl-12 h-14 text-lg shadow-sm border-border focus:border-primary focus:ring-primary/20 rounded-xl bg-white"
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
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{product.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {product.internal_code || "Sem código"}
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

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Minus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ProductCatalog, searchProductCatalog } from "@/services/database/product-catalog";
import { formatCurrency } from "@/utils/format";
import { NewOrderItem } from "@/hooks/useNewOrder";
import { Label } from "@/components/ui/label";

interface NewOrderProductSearchProps {
    items: NewOrderItem[];
    onProductSelect: (product: ProductCatalog) => void;
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemoveItem: (itemId: string) => void;
    importedFromWhatsApp?: boolean;
}

import { cn } from "@/lib/utils";

export function NewOrderProductSearch({
    items,
    onProductSelect,
    onUpdateQuantity,
    onRemoveItem,
    importedFromWhatsApp
}: NewOrderProductSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ProductCatalog[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowPreview(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        const { data } = await searchProductCatalog(query);
        setSearchResults(data || []);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 200);
        return () => clearTimeout(timer);
    }, [searchQuery, performSearch]);

    const handleSelect = (product: ProductCatalog) => {
        onProductSelect(product);
        setSearchQuery("");
        setShowPreview(false);
        setSearchResults([]);
    };

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">Produtos</Label>

            <div className="relative" ref={containerRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-10 h-12 bg-card border-sidebar-border"
                        placeholder="Buscar produto por nome..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowPreview(true);
                        }}
                        onFocus={() => {
                            if (searchResults.length > 0) setShowPreview(true);
                        }}
                    />
                </div>

                <AnimatePresence>
                    {showPreview && searchQuery && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg shadow-xl border border-sidebar-border max-h-48 overflow-y-auto z-50"
                        >
                            {searchResults.length > 0 ? (
                                searchResults.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors border-b border-sidebar-border last:border-0"
                                        onClick={() => handleSelect(product)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-foreground">{product.name}</span>
                                            {product.catalog_barcode && (
                                                <span className="text-xs text-muted-foreground">
                                                    Cód: {product.catalog_barcode}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-primary">
                                            {formatCurrency(product.base_price)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                    Nenhum produto encontrado
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {items.length > 0 && (
                <div className="space-y-2">
                    <div className="bg-muted/30 rounded-lg divide-y divide-sidebar-border border border-sidebar-border">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "flex items-center justify-between p-3 gap-3 transition-colors duration-500",
                                    importedFromWhatsApp
                                        ? "bg-green-50/50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900 last:border-0"
                                        : ""
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "font-medium text-sm truncate transition-colors",
                                        importedFromWhatsApp && "text-green-700 dark:text-green-300"
                                    )}>
                                        {item.product.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(item.unitPrice)} cada
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium text-sm">
                                        {item.quantity}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-20 text-right font-semibold text-sm">
                                        {formatCurrency(item.totalPrice)}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => onRemoveItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(subtotal)}</span>
                    </div>
                </div>
            )}

            {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-sidebar-border rounded-lg">
                    Busque e adicione produtos ao pedido
                </div>
            )}
        </div>
    );
}

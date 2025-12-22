import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Flame, Plus, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { getProductCatalog, getTopSellingProducts, ProductCatalog } from "@/services/database/product-catalog";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

// Helper to check if an external product is out of stock
const isOutOfStock = (product: ProductCatalog): boolean => {
    return !product.is_internal && (product.quantity ?? 0) <= 0;
};

interface ProductSidebarRightProps {
    onProductSelect: (product: ProductCatalog) => void;
    onOpenChange?: (open: boolean) => void;
    externalOpen?: boolean;
}

export function ProductSidebarRight({ onProductSelect, onOpenChange, externalOpen }: ProductSidebarRightProps) {
    const isMobile = useIsMobile();
    // null = not yet determined, then set based on device type
    const [isOpen, setIsOpen] = useState<boolean | null>(null);
    const [products, setProducts] = useState<ProductCatalog[]>([]);
    const [topProducts, setTopProducts] = useState<ProductCatalog[]>([]);
    const [search, setSearch] = useState("");
    const hasInitialized = useRef(false);
    // Removed direct useCartStore use for adding items, relying on parent handler
    // const addItem = useCartStore((state) => state.addItem);

    const loadProducts = async () => {
        const [catalogResult, topResult] = await Promise.all([
            getProductCatalog(),
            getTopSellingProducts(6)
        ]);

        if (catalogResult.data) setProducts(catalogResult.data);
        if (topResult.data) setTopProducts(topResult.data);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Set initial open state once we know if it's mobile or not
    // Mobile: starts closed, Desktop: starts open
    useEffect(() => {
        if (isMobile === undefined) return; // Wait for hook to determine

        if (!hasInitialized.current) {
            // First time: set initial state without animation
            hasInitialized.current = true;
            setIsOpen(!isMobile); // Desktop: open, Mobile: closed
        } else {
            // Subsequent changes (e.g., window resize)
            setIsOpen(!isMobile);
        }
    }, [isMobile]);

    // Sync with external open state (from footer button)
    useEffect(() => {
        if (externalOpen !== undefined) {
            setIsOpen(externalOpen);
        }
    }, [externalOpen]);

    // Don't render until we know the device type to prevent glimpse
    if (isOpen === null) {
        return null;
    }

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    // const topProducts = products.slice(0, 6); // Mock removed

    const handleAddItem = (product: ProductCatalog) => {
        // Block out-of-stock external products
        if (isOutOfStock(product)) {
            toast.error(`Produto sem estoque: ${product.name}`);
            return;
        }

        onProductSelect(product);
        if (isMobile) {
            // Optional: Close sidebar on selection logic if desired, or keep open
            // setIsOpen(false); 
        }
    };

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {(isMobile && isOpen) && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={cn(
                "flex items-center transition-all z-50",
                isMobile
                    ? "fixed bottom-0 right-0 h-[80vh] w-full pointer-events-none" // Mobile: Bottom sheet-ish or full overlay
                    : "relative h-[calc(100%-2rem)] my-4 mr-4" // Desktop: Sidebar
            )}>
                {/* Desktop only toggle button - mobile uses footer button */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute z-50 -left-4 h-8 w-8 rounded-full shadow-lg pointer-events-auto bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                )}

                <motion.div
                    initial={{ width: isMobile ? "100%" : 280, height: isMobile ? 0 : "100%" }}
                    animate={{
                        width: isMobile ? "100%" : (isOpen ? 280 : 0),
                        height: isMobile ? (isOpen ? "100%" : 0) : "100%",
                        opacity: isMobile ? (isOpen ? 1 : 0) : 1
                    }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className={cn(
                        "bg-card flex flex-col shadow-sm overflow-hidden pointer-events-auto",
                        isMobile
                            ? "rounded-t-2xl border-t border-sidebar-border w-full absolute bottom-0"
                            : "h-full border border-sidebar-border rounded-2xl"
                    )}
                >
                    <div className={cn("flex flex-col h-full", isMobile ? "w-full" : "w-[280px]")}>
                        <div className="p-4 border-b border-sidebar-border space-y-3 bg-sidebar/50">
                            <h3 className="font-playfair font-semibold text-lg text-foreground flex justify-between items-center">
                                Produtos
                                {isMobile && (
                                    <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Fechar</Button>
                                )}
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar..."
                                    className="pl-8 bg-card border-sidebar-border focus:ring-primary/20 rounded-xl"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {!search && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 text-primary font-medium text-sm px-1">
                                        <Flame className="h-4 w-4 fill-primary" />
                                        Mais Vendidos
                                    </div>
                                    {topProducts.length === 0 ? (
                                        <div className="text-center p-4 bg-sidebar-accent/50 rounded-xl border border-sidebar-border border-dashed">
                                            <p className="text-xs text-muted-foreground italic">Nenhum destaque por enquanto</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {topProducts.filter(p => p.is_active !== false).map((product) => (
                                                <div
                                                    key={product.id}
                                                    className={cn(
                                                        "group relative rounded-xl p-2 cursor-pointer transition-all border shadow-sm hover:shadow-md",
                                                        isOutOfStock(product)
                                                            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/50"
                                                            : "bg-card hover:bg-accent border-sidebar-border hover:border-primary/20"
                                                    )}
                                                    onClick={() => handleAddItem(product)}
                                                >
                                                    <div className="h-16 w-full bg-sidebar-accent rounded-lg mb-2 flex items-center justify-center text-xs text-primary/40 overflow-hidden relative">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                                                            />
                                                        ) : (
                                                            "IMG"
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs font-bold text-primary">
                                                        {formatCurrency(product.base_price)}
                                                    </p>
                                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 rounded-full p-1">
                                                        <Plus className="h-3 w-3 text-primary" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                    Todos os Produtos
                                </h4>
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-8 px-4">
                                        <p className="text-sm text-muted-foreground font-medium">Nenhum produto encontrado</p>
                                        <p className="text-xs text-muted-foreground mt-1">Tente buscar por outro nome.</p>
                                    </div>
                                ) : (
                                    <div className={isMobile ? "grid grid-cols-1 gap-2" : "space-y-2"}>
                                        {filteredProducts.filter(p => p.is_active !== false).map((product) => (
                                            <div
                                                key={product.id}
                                                className={cn(
                                                    "flex items-center gap-3 p-2 rounded-xl cursor-pointer border shadow-sm transition-all group",
                                                    isOutOfStock(product)
                                                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950/50"
                                                        : "bg-card hover:bg-accent border-sidebar-border"
                                                )}
                                                onClick={() => handleAddItem(product)}
                                            >
                                                <div className="h-10 w-10 bg-card border border-sidebar-border rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] text-primary/40 overflow-hidden relative">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        "IMG"
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground group-hover:text-primary/80">
                                                        {formatCurrency(product.base_price)}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-sidebar-accent rounded-full"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </motion.div>
            </div>
        </>
    );
}

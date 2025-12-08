import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { getProductCatalog, ProductCatalog } from "@/services/database/product-catalog";
import { useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProductSidebarRightProps {
    onProductSelect: (product: ProductCatalog) => void;
}

export function ProductSidebarRight({ onProductSelect }: ProductSidebarRightProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [products, setProducts] = useState<ProductCatalog[]>([]);
    const [search, setSearch] = useState("");
    // Removed direct useCartStore use for adding items, relying on parent handler
    // const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        const { data } = await getProductCatalog();
        if (data) setProducts(data);
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const topProducts = products.slice(0, 6); // Mock top products for now

    const handleAddItem = (product: ProductCatalog) => {
        onProductSelect(product);
    };

    return (
        <div className="relative h-full my-4 mr-4 flex items-center">
            <Button
                variant="ghost"
                size="icon"
                className="absolute -left-4 z-50 h-8 w-8 rounded-full shadow-sm bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            <motion.div
                initial={{ width: 280 }}
                animate={{ width: isOpen ? 280 : 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="h-full border border-sidebar-border bg-white flex flex-col shadow-sm rounded-2xl overflow-hidden"
            >
                <div className="flex flex-col h-full w-[280px]">
                    <div className="p-4 border-b border-sidebar-border space-y-3 bg-sidebar/50">
                        <h3 className="font-playfair font-semibold text-lg text-foreground">
                            Produtos
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                className="pl-8 bg-white border-sidebar-border focus:ring-primary/20 rounded-xl"
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
                                        {topProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className="group relative bg-white hover:bg-sidebar-accent rounded-xl p-2 cursor-pointer transition-all border border-sidebar-border hover:border-primary/20 shadow-sm hover:shadow-md"
                                                onClick={() => handleAddItem(product)}
                                            >
                                                <div className="h-16 w-full bg-sidebar-accent rounded-lg mb-2 flex items-center justify-center text-xs text-primary/40">
                                                    IMG
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
                                filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-3 p-2 rounded-xl bg-white cursor-pointer border border-sidebar-border shadow-sm transition-all hover:bg-sidebar-accent group"
                                        onClick={() => handleAddItem(product)}
                                    >
                                        <div className="h-10 w-10 bg-white border border-sidebar-border rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] text-primary/40">
                                            IMG
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
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </motion.div>
        </div>
    );
}

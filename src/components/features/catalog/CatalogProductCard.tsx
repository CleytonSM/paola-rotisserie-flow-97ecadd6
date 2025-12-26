import React from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { useCatalogStore } from "@/stores/useCatalogStore";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface CatalogProductCardProps {
    product: {
        id: string;
        name: string;
        description?: string | null;
        base_price: number;
        image_url?: string | null;
        unit_type?: string;
    };
}

export const CatalogProductCard = ({ product }: CatalogProductCardProps) => {
    const addItem = useCatalogStore((state) => state.addItem);
    const lastOrderedProductIds = useCatalogStore((state) => state.lastOrderedProductIds);
    const isLastOrdered = lastOrderedProductIds.includes(product.id);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden h-full flex flex-col border-border/50 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                    )}
                    {isLastOrdered && (
                        <div className="absolute top-2 left-2 z-10">
                            <div className="bg-primary px-3 py-1 rounded-full text-[10px] font-bold text-primary-foreground shadow-lg border border-primary-foreground/20 uppercase tracking-tighter">
                                Pedido por último
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2">
                        <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-primary/10">
                            Preço por {product.unit_type === 'kg' ? 'kg' : 'unid.'}
                        </div>
                    </div>
                </div>

                <CardContent className="flex-1 p-5 space-y-2">
                    <h3 className="font-display text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {product.description || "Nenhuma descrição disponível."}
                    </p>
                </CardContent>

                <CardFooter className="p-5 pt-0 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Valor base</span>
                        <span className="text-2xl font-bold text-primary">
                            {formatCurrency(product.base_price)}
                        </span>
                    </div>
                    <Button
                        size="icon"
                        className="h-12 w-12 rounded-full shadow-lg shadow-primary/20 hover:scale-110 transition-transform active:scale-95"
                        onClick={() => {
                            addItem(product);
                            toast.success(`${product.name} adicionado ao carrinho!`);
                        }}
                        title="Adicionar ao carrinho"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

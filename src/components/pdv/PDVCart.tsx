import { CartItem } from "@/components/pdv/CartItem";
import { EmptyCartState } from "@/components/pdv/EmptyCartState";
import { CartItem as CartItemType } from "@/stores/cartStore";
import { AnimatePresence } from "framer-motion";
import { ShoppingBasket } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PDVCartProps {
    items: CartItemType[];
    onAddInternalItem: (catalogId: string) => void;
}

export function PDVCart({ items, onAddInternalItem }: PDVCartProps) {
    return (
        <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-2">
                <div className="max-w-3xl mx-auto h-full">
                    <AnimatePresence>
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                <ShoppingBasket className="h-12 w-12 mb-2" />
                                <p>Seu carrinho está vazio</p>
                            </div>
                        ) : (
                            items.map((item) => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onAddMore={onAddInternalItem}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ScrollArea>
    );
}

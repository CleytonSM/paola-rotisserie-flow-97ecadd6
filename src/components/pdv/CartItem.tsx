import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem as CartItemType, useCartStore } from "@/stores/cartStore";
import { motion } from "framer-motion";

interface CartItemProps {
    item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem } = useCartStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center justify-between p-3 mb-2 bg-white rounded-lg shadow-sm border border-sidebar-border"
        >
            <div className="flex-1">
                <h4 className="font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                <div className="text-sm text-gray-500">
                    {formatCurrency(item.base_price)}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center bg-primary/10 rounded-full px-1 py-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-primary/20 text-primary"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium text-foreground text-sm">
                        {item.quantity}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-primary/20 text-primary"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                <div className="text-right min-w-[80px]">
                    <div className="font-bold text-primary">
                        {formatCurrency(item.base_price * item.quantity)}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeItem(item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    );
}

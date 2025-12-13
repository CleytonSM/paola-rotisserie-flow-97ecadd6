import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { Minus, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { CartItem as CartItemType, useCartStore } from "@/stores/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CartItemProps {
    item: CartItemType;
    onAddMore?: (catalogId: string) => void;
}

export function CartItem({ item, onAddMore }: CartItemProps) {
    const { updateQuantity, removeItem, removeSubItem } = useCartStore();
    const [expanded, setExpanded] = useState(false);

    const isInternalGroup = item.is_internal && item.subItems && item.subItems.length > 0;

    // Calculate total for display
    const currentTotal = isInternalGroup
        ? item.subItems!.reduce((acc, sub) => acc + sub.price, 0)
        : item.base_price * item.quantity;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={cn(
                "p-3 mb-2 bg-white rounded-lg shadow-sm border border-sidebar-border",
                isInternalGroup && "border-primary/20"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => isInternalGroup && setExpanded(!expanded)}>
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800 line-clamp-1">{item.name}</h4>
                        {isInternalGroup && (
                            expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                    {!isInternalGroup ? (
                        <div className="text-sm text-gray-500">
                            {formatCurrency(item.base_price)}
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">
                            {item.quantity} itens selecionados
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-primary/10 rounded-full px-1 py-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-primary/20 text-primary"
                            onClick={() => {
                                if (isInternalGroup) {
                                    // Remove last item? Or just prevent standard minus?
                                    // ideally we remove specific item, but here it's generic minus.
                                    // Let's remove the last added sub-item as a default "undo".
                                    const lastSub = item.subItems![item.subItems!.length - 1];
                                    removeSubItem(item.id, lastSub.id);
                                } else {
                                    updateQuantity(item.id, item.quantity - 1);
                                }
                            }}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium text-foreground text-sm">
                            {item.quantity}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-7 w-7 rounded-full hover:bg-primary/20 text-primary",
                                (!isInternalGroup && item.stock !== undefined && item.quantity >= item.stock) && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={!isInternalGroup && item.stock !== undefined && item.quantity >= item.stock}
                            onClick={() => {
                                if (isInternalGroup) {
                                    if (onAddMore) onAddMore(item.id);
                                } else {
                                    if (item.stock !== undefined && item.quantity >= item.stock) {
                                        toast.error(`Limite de estoque atingido: ${item.stock}`);
                                        return;
                                    }
                                    updateQuantity(item.id, item.quantity + 1);
                                }
                            }}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="text-right min-w-[80px]">
                        <div className="font-bold text-primary">
                            {formatCurrency(currentTotal)}
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
            </div>

            <AnimatePresence>
                {isInternalGroup && expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-100 space-y-1">
                            {item.subItems!.map((sub, idx) => (
                                <div key={sub.id} className="flex items-center justify-between text-xs py-1 px-1 hover:bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-gray-400">#{sub.barcode}</span>
                                        <span className="text-gray-600">{sub.weight.toFixed(3)}kg</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-gray-700">{formatCurrency(sub.price)}</span>
                                        <button
                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                            onClick={() => removeSubItem(item.id, sub.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}

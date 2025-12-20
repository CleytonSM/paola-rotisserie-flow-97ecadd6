import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/format";
import { CartItem } from "@/stores/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentSummaryProps {
    items: CartItem[];
    subtotal: number;
    total: number;
    notes: string;
    setNotes: (notes: string) => void;
    isDelivery?: boolean;
    deliveryFee?: number;
}

export function PaymentSummary({ items, subtotal, total, notes, setNotes, isDelivery, deliveryFee }: PaymentSummaryProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sidebar-border">
                <h2 className="font-playfair font-semibold text-lg mb-4 text-foreground">Resumo do Pedido</h2>
                <ScrollArea className="max-h-[400px]">
                    <div className="space-y-3 pr-4">
                        {items.map((item) => (
                            <div key={item.id}>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                                    <span className="font-medium text-foreground">
                                        {formatCurrency(
                                            item.subItems && item.subItems.length > 0
                                                ? item.subItems.reduce((acc, sub) => acc + sub.price, 0)
                                                : item.base_price * item.quantity
                                        )}
                                    </span>
                                </div>
                                {item.subItems && item.subItems.length > 0 && (
                                    <div className="pl-4 mt-1 space-y-0.5">
                                        {item.subItems.map((sub) => (
                                            <div key={sub.id} className="flex justify-between text-xs text-muted-foreground/80">
                                                <span>{sub.weight.toFixed(3)}kg</span>
                                                <span>{formatCurrency(sub.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="border-t border-sidebar-border mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {isDelivery && (
                        <div className="flex justify-between text-muted-foreground">
                            <span>Taxa de Entrega</span>
                            <span>{formatCurrency(deliveryFee || 0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-2xl font-bold text-primary pt-2">
                        <span>TOTAL</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-sidebar-border">
                <h2 className="font-playfair font-semibold text-lg mb-4 text-foreground">Observações</h2>
                <Textarea
                    placeholder="Alguma observação sobre o pedido?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none border-sidebar-border focus:border-primary focus:ring-primary/20"
                />
            </div>
        </div>
    );
}

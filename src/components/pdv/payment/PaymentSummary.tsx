import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/utils/format";
import { CartItem } from "@/stores/cartStore";

interface PaymentSummaryProps {
    items: CartItem[];
    subtotal: number;
    total: number;
    notes: string;
    setNotes: (notes: string) => void;
}

export function PaymentSummary({ items, subtotal, total, notes, setNotes }: PaymentSummaryProps) {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sidebar-border">
                <h2 className="font-playfair font-semibold text-lg mb-4 text-foreground">Resumo do Pedido</h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                            <span className="font-medium text-foreground">{formatCurrency(item.base_price * item.quantity)}</span>
                        </div>
                    ))}
                </div>
                <div className="border-t border-sidebar-border mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
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

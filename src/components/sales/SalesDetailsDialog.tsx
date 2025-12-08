import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import { Receipt, Calendar, User, Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SalesDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: any | null;
}

export function SalesDetailsDialog({
    open,
    onOpenChange,
    sale
}: SalesDetailsDialogProps) {
    if (!sale) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Venda #{sale.display_id || sale.id.slice(0, 8)}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Data</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Cliente</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {sale.clients?.name || "Consumidor Final"}
                        </div>
                    </div>

                    <div className="space-y-1 col-span-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Pagamento</span>
                        <div className="flex items-center gap-2 text-sm font-medium capitalize">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            {sale.sale_payments?.map((p: any) => {
                                const methods: Record<string, string> = {
                                    "credit_card": "Crédito",
                                    "card_credit": "Crédito",
                                    "debit_card": "Débito",
                                    "card_debit": "Débito",
                                    "pix": "Pix",
                                    "cash": "Dinheiro"
                                };
                                return methods[p.payment_method] || p.payment_method;
                            }).join(", ") || "-"}
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="py-4 space-y-4">
                    <h4 className="text-sm font-medium leading-none">Itens do Pedido</h4>
                    <div className="space-y-3">
                        {sale.sale_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <span className="font-medium">{item.quantity}x</span>{' '}
                                    <span className="text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(item.total_price)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(sale.total_amount)}</span>
                    </div>
                    {sale.change_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Troco</span>
                            <span>{formatCurrency(sale.change_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2">
                        <span>Total Pago</span>
                        <span className="text-emerald-600">{formatCurrency(sale.total_amount)}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

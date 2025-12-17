import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/services/database";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Package, CreditCard, Calendar, FileText, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface OrderDetailDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
}

export function OrderDetailDialog({
    order,
    open,
    onOpenChange,
    onStatusChange,
    isUpdating
}: OrderDetailDialogProps) {
    if (!order) return null;

    const paidAmount = order.sale_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const isPaid = paidAmount >= order.total_amount;
    const remainingAmount = order.total_amount - paidAmount;

    const getNextStatus = (): OrderStatus | null => {
        switch (order.order_status) {
            case 'received': return 'preparing';
            case 'preparing': return 'ready';
            case 'ready': return 'delivered';
            default: return null;
        }
    };

    const nextStatus = getNextStatus();

    const getActionButtonStyle = (status: OrderStatus) => {
        switch (status) {
            case 'preparing':
                return "bg-amber-500 hover:bg-amber-600 text-white";
            case 'ready':
                return "bg-emerald-500 hover:bg-emerald-600 text-white";
            case 'delivered':
                return "bg-primary hover:bg-primary/90 text-primary-foreground";
            default:
                return "";
        }
    };

    const formatPaymentMethod = (method: string) => {
        const methods: Record<string, string> = {
            'pix': 'Pix',
            'cash': 'Dinheiro',
            'card_credit': 'Cartão Crédito',
            'card_debit': 'Cartão Débito',
            'multiple': 'Múltiplos'
        };
        return methods[method] || method;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                Pedido #{order.display_id}
                                <Badge
                                    variant="outline"
                                    className={cn("text-sm", ORDER_STATUS_COLORS[order.order_status])}
                                >
                                    {ORDER_STATUS_LABELS[order.order_status]}
                                </Badge>
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 space-y-6">
                        {/* Cliente */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Cliente</p>
                                <p className="font-medium">{order.clients?.name || "Consumidor Final"}</p>
                                {order.clients?.phone && (
                                    <p className="text-sm text-muted-foreground">{order.clients.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Retirada */}
                        {order.scheduled_pickup && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Retirada Agendada</p>
                                    <p className="font-medium">
                                        {format(new Date(order.scheduled_pickup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Itens */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Itens do Pedido</h3>
                            </div>
                            <div className="space-y-2">
                                {order.sale_items?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.quantity}x {formatCurrency(item.unit_price)}
                                            </p>
                                        </div>
                                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Pagamento */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Pagamento</h3>
                            </div>
                            <div className="space-y-2">
                                {order.sale_payments?.map((payment, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                                        <p className="font-medium">{formatPaymentMethod(payment.payment_method)}</p>
                                        <p className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</p>
                                    </div>
                                ))}
                            </div>

                            {!isPaid && remainingAmount > 0 && (
                                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-amber-800">Restante a pagar</p>
                                        <p className="font-bold text-amber-800">{formatCurrency(remainingAmount)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Observações */}
                        {order.notes && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <h3 className="font-semibold">Observações</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        {order.notes}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Total */}
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-semibold">Total</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                            </div>
                            {isPaid && (
                                <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                    Pago
                                </Badge>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* Action Button */}
                {nextStatus && onStatusChange && (
                    <div className="p-4 border-t bg-muted/20">
                        <Button
                            onClick={() => {
                                onStatusChange(order.id, nextStatus);
                                onOpenChange(false);
                            }}
                            disabled={isUpdating}
                            className={cn(
                                "w-full h-12 text-base font-medium",
                                getActionButtonStyle(nextStatus)
                            )}
                        >
                            Marcar como {ORDER_STATUS_LABELS[nextStatus]}
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

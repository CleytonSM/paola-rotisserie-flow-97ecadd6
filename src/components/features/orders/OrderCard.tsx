import { useState, useEffect } from "react";
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/services/database";
import { formatCurrency } from "@/utils/format";
import { format, isToday, isTomorrow, isPast, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, ChevronRight, AlertCircle, GripVertical, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderCardProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    onClick?: () => void;
    isUpdating?: boolean;
}

export function OrderCard({ order, onStatusChange, onClick, isUpdating }: OrderCardProps) {
    const paidAmount = order.sale_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const isPaid = paidAmount >= order.total_amount;
    const hasPartialPayment = paidAmount > 0 && paidAmount < order.total_amount;

    const pickupDate = order.scheduled_pickup ? new Date(order.scheduled_pickup) : null;
    const isLate = pickupDate && isPast(pickupDate) && order.order_status !== 'delivered' && order.order_status !== 'cancelled';

    // Badge logic:
    // If Late AND (received OR preparing) -> Show "Atrasado" badge ONLY (replace status badge)
    // If Late AND (ready OR delivered) -> Show standard status badge
    const showLateBadgeInsteadOfStatus = isLate && (order.order_status === 'received' || order.order_status === 'preparing');

    // Countdown logic
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        if (!pickupDate || isLate || (order.order_status !== 'received' && order.order_status !== 'preparing')) {
            setTimeLeft("");
            return;
        }

        const tick = () => {
            const now = new Date();
            const diffSecs = differenceInSeconds(pickupDate, now);

            if (diffSecs <= 0) {
                // Time up, likely will become late on next check/refresh
                setTimeLeft("");
                return;
            }

            const hours = Math.floor(diffSecs / 3600);
            const minutes = Math.floor((diffSecs % 3600) / 60);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}min`);
            } else {
                setTimeLeft(`${minutes}min`);
            }
        };

        tick(); // Initial run
        const timer = setInterval(tick, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [pickupDate, isLate, order.order_status]);

    const formatPickupTime = () => {
        if (!pickupDate) return "Sem agendamento";

        if (isToday(pickupDate)) {
            return `Hoje às ${format(pickupDate, "HH:mm")}`;
        }
        if (isTomorrow(pickupDate)) {
            return `Amanhã às ${format(pickupDate, "HH:mm")}`;
        }
        return format(pickupDate, "dd/MM 'às' HH:mm", { locale: ptBR });
    };

    const itemsSummary = order.sale_items
        ?.slice(0, 3)
        .map(item => `${item.quantity}x ${item.name}`)
        .join(", ") || "";

    const hasMoreItems = (order.sale_items?.length || 0) > 3;

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

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all hover:shadow-md cursor-pointer select-none",
                // Updated Styling: 
                // Removed ring-2 ring-red-400 ring-offset-2
                // Added border-2 border-red-500 when late
                isLate && "border-2 border-red-500"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4 relative">
                {/* Subtle drag indicator */}
                <div className="absolute right-2 top-2 opacity-30 hover:opacity-60 transition-opacity">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-start justify-between gap-3 mb-3 pr-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">#{order.display_id}</span>

                            {showLateBadgeInsteadOfStatus ? (
                                <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Atrasado
                                </Badge>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className={cn("text-xs", ORDER_STATUS_COLORS[order.order_status])}
                                >
                                    {ORDER_STATUS_LABELS[order.order_status]}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">{order.clients?.name || "Consumidor Final"}</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="font-semibold text-lg text-emerald-600">
                            {formatCurrency(order.total_amount)}
                        </div>
                        {hasPartialPayment && (
                            <div className="text-xs text-amber-600">
                                Sinal: {formatCurrency(paidAmount)}
                            </div>
                        )}
                        {isPaid && (
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                                Pago
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm mb-3">
                    <Clock className={cn("w-4 h-4", isLate ? "text-red-500" : "text-muted-foreground")} />
                    <span className={cn(isLate && "text-red-600 font-medium")}>
                        {formatPickupTime()}
                    </span>
                </div>

                {itemsSummary && (
                    <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {itemsSummary}
                        {hasMoreItems && " ..."}
                    </div>
                )}

                {nextStatus && (
                    <div className="space-y-2">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(order.id, nextStatus);
                            }}
                            disabled={isUpdating}
                            className={cn(
                                "w-full h-12 text-base font-medium",
                                getActionButtonStyle(nextStatus)
                            )}
                        >
                            {ORDER_STATUS_LABELS[nextStatus]}
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>

                        {timeLeft && (
                            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 py-1.5 rounded-md border border-amber-100">
                                <Timer className="w-3.5 h-3.5" />
                                <span>Prepare em até {timeLeft}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

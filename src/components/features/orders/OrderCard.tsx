import { useState, useEffect } from "react";
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/services/database";
import { formatCurrency } from "@/utils/format";
import { format, isToday, isTomorrow, isPast, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, ChevronRight, AlertCircle, Store, Timer, Bike } from "lucide-react";
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
                "overflow-hidden transition-all hover:shadow-md cursor-pointer select-none group border-l-4",
                // Status borders
                order.order_status === 'received' && "border-l-blue-700",
                order.order_status === 'preparing' && "border-l-amber-500",
                order.order_status === 'ready' && "border-l-emerald-500",
                order.order_status === 'delivered' && "border-l-primary",

                // Late override
                isLate && "border-l-red-500 ring-1 ring-red-100"
            )}
            onClick={onClick}
        >
            <CardContent className="p-3">
                {/* Header: ID + Time + Price */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-base">#{order.display_id}</span>
                        {showLateBadgeInsteadOfStatus && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                                Atrasado
                            </Badge>
                        )}

                        {/* Delivery/Pickup Badge - Cleaner look */}
                        {order.is_delivery ? (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                <Bike className="w-3 h-3" />
                                <span>Entrega</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                <Store className="w-3 h-3" />
                                <span>Retirada</span>
                            </div>
                        )}
                    </div>

                    <div className="text-right leading-tight">
                        <div className="font-bold text-sm text-emerald-700">
                            {formatCurrency(order.total_amount)}
                        </div>
                        {hasPartialPayment && (
                            <span className="text-[10px] text-muted-foreground block">
                                Pago: {formatCurrency(paidAmount)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Client Name + Sub location */}
                <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate flex-1 min-w-0" title={order.clients?.name}>
                            {order.clients?.name || "Consumidor Final"}
                        </span>
                    </div>

                    {/* Location or Time Subtext */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-5">
                        {order.is_delivery && order.client_addresses?.neighborhood ? (
                            <span className="truncate flex-1 min-w-0 text-orange-600/80">
                                {order.client_addresses.neighborhood}
                            </span>
                        ) : (
                            <div className={cn("flex items-center gap-1 shrink-0", isLate ? "text-red-600 font-medium" : "")}>
                                <Clock className="w-3 h-3" />
                                <span>{formatPickupTime()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Items Summary - Lighter */}
                {itemsSummary && (
                    <div className="text-xs text-muted-foreground mb-3 pl-1 border-l-2 border-muted leading-relaxed line-clamp-2">
                        {itemsSummary}
                        {hasMoreItems && "..."}
                    </div>
                )}

                {/* Footer Actions - Compact */}
                {nextStatus && (
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-dashed">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(order.id, nextStatus);
                            }}
                            disabled={isUpdating}
                            size="sm"
                            variant="outline"
                            className={cn(
                                "flex-1 h-10 text-sm font-medium min-w-0", // Added flex-1 and min-w-0
                                getActionButtonStyle(nextStatus)
                            )}
                        >
                            <span className="truncate">{ORDER_STATUS_LABELS[nextStatus]}</span>
                            <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
                        </Button>

                        {timeLeft && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 h-8 rounded border border-amber-100 min-w-fit shrink-0">
                                <Timer className="w-3 h-3" />
                                {timeLeft}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

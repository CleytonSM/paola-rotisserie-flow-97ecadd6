import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getUpcomingOrders, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/services/database";
import { formatCurrency } from "@/utils/format";
import { format, isToday, isTomorrow } from "date-fns";
import { Clock, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function TodayOrdersWidget() {
    const navigate = useNavigate();

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['upcomingOrders'],
        queryFn: async () => {
            const { data, error } = await getUpcomingOrders();
            if (error) throw error;
            return data || [];
        },
        refetchInterval: 30000,
    });

    const formatPickupTime = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) {
            return `Hoje ${format(date, "HH:mm")}`;
        }
        if (isTomorrow(date)) {
            return `Amanhã ${format(date, "HH:mm")}`;
        }
        return format(date, "dd/MM HH:mm");
    };

    const pendingCount = orders.filter(
        o => o.order_status !== 'delivered' && o.order_status !== 'cancelled'
    ).length;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Pedidos de Hoje
                    {pendingCount > 0 && (
                        <Badge className="bg-amber-500 text-white">
                            {pendingCount}
                        </Badge>
                    )}
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/orders')}
                    className="text-primary"
                >
                    Ver todos
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Nenhum pedido agendado</p>
                        <p className="text-xs mt-1">para os próximos dias</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => navigate('/orders')}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                            #{order.display_id}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", ORDER_STATUS_COLORS[order.order_status])}
                                        >
                                            {ORDER_STATUS_LABELS[order.order_status]}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground truncate">
                                            {order.clients?.name || "Consumidor"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">•</span>
                                        <span className="text-xs font-medium">
                                            {order.scheduled_pickup && formatPickupTime(order.scheduled_pickup)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold text-emerald-600">
                                        {formatCurrency(order.total_amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {orders.length > 5 && (
                            <p className="text-xs text-center text-muted-foreground">
                                +{orders.length - 5} pedidos
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

import { useMemo } from "react";
import { Order, OrderStatus, ORDER_STATUS_LABELS } from "@/services/database";
import { OrderCard } from "../OrderCard";
import { OrderDetailDialog } from "../OrderDetailDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TabValue = "all" | OrderStatus;

interface MobileKanbanTabsProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
    selectedOrderId: string | null;
    onSelectOrder: (orderId: string | null) => void;
}

const TAB_CONFIG: { value: TabValue; label: string; color: string }[] = [
    { value: "all", label: "Todos", color: "data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800" },
    { value: "received", label: "Recebido", color: "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800" },
    { value: "preparing", label: "Preparo", color: "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800" },
    { value: "ready", label: "Pronto", color: "data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800" },
    { value: "delivered", label: "Entregue", color: "data-[state=active]:bg-primary/20 data-[state=active]:text-primary" },
];

export function MobileKanbanTabs({
    orders,
    onStatusChange,
    isUpdating,
    selectedOrderId,
    onSelectOrder,
}: MobileKanbanTabsProps) {
    const selectedOrder = useMemo(
        () => orders.find((o) => o.id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );

    const getOrdersByTab = (tab: TabValue) => {
        if (tab === "all") return orders;
        return orders.filter((order) => order.order_status === tab);
    };

    const getOrderCount = (tab: TabValue) => {
        if (tab === "all") return orders.length;
        return orders.filter((order) => order.order_status === tab).length;
    };

    return (
        <>
            <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-5 h-auto p-1 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
                    {TAB_CONFIG.map(({ value, label, color }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className={cn(
                                "flex flex-col gap-0.5 py-2 px-1 text-xs font-medium transition-all min-w-0",
                                color
                            )}
                        >
                            <span className="truncate">{label}</span>
                            <span className="text-[10px] opacity-70">
                                {getOrderCount(value)}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {TAB_CONFIG.map(({ value }) => (
                    <TabsContent
                        key={value}
                        value={value}
                        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                        <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
                            <div className="p-4 space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {getOrdersByTab(value).length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-12 text-muted-foreground"
                                        >
                                            Nenhum pedido{" "}
                                            {value === "all"
                                                ? ""
                                                : value === "received"
                                                    ? "recebido"
                                                    : value === "preparing"
                                                        ? "em preparo"
                                                        : value === "ready"
                                                            ? "pronto"
                                                            : "entregue"}
                                        </motion.div>
                                    ) : (
                                        getOrdersByTab(value).map((order) => (
                                            <motion.div
                                                key={order.id}
                                                layout="position"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{
                                                    layout: { type: "spring", stiffness: 350, damping: 30 },
                                                    opacity: { duration: 0.15 },
                                                }}
                                            >
                                                <OrderCard
                                                    order={order}
                                                    onStatusChange={onStatusChange}
                                                    onClick={() => onSelectOrder(order.id)}
                                                    isUpdating={isUpdating}
                                                />
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                ))}
            </Tabs>

            <OrderDetailDialog
                order={selectedOrder}
                open={!!selectedOrderId}
                onOpenChange={(open) => !open && onSelectOrder(null)}
                onStatusChange={onStatusChange}
                isUpdating={isUpdating}
            />
        </>
    );
}

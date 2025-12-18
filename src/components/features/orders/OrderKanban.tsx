import { useState, useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import { Order, OrderStatus, ORDER_STATUS_LABELS } from "@/services/database";
import { OrderCard } from "./OrderCard";
import { DraggableOrderCard } from "./DraggableOrderCard";
import { OrderDetailDialog } from "./OrderDetailDialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OrderKanbanProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
}

const KANBAN_COLUMNS: { status: OrderStatus; color: string; dropColor: string }[] = [
    { status: 'received', color: 'bg-blue-50 border-blue-200', dropColor: 'ring-blue-400 bg-blue-100/50' },
    { status: 'preparing', color: 'bg-amber-50 border-amber-200', dropColor: 'ring-amber-400 bg-amber-100/50' },
    { status: 'ready', color: 'bg-emerald-50 border-emerald-200', dropColor: 'ring-emerald-400 bg-emerald-100/50' },
    { status: 'delivered', color: 'bg-primary/10 border-primary/30', dropColor: 'ring-primary bg-primary/20' },
];

interface DroppableColumnProps {
    status: OrderStatus;
    color: string;
    dropColor: string;
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    onCardClick: (order: Order) => void;
    isUpdating?: boolean;
    activeOrderId?: string | null;
}

function DroppableColumn({
    status,
    color,
    dropColor,
    orders,
    onStatusChange,
    onCardClick,
    isUpdating,
    activeOrderId,
}: DroppableColumnProps) {
    const { setNodeRef, isOver, active } = useDroppable({
        id: status,
    });

    const count = orders.length;
    const isDraggingOver = isOver && active?.data.current?.currentStatus !== status;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col rounded-xl border-2 overflow-hidden transition-all duration-200",
                color,
                isDraggingOver && `ring-2 ring-offset-2 ${dropColor}`
            )}
        >
            <div className="px-4 py-3 border-b bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">
                        {ORDER_STATUS_LABELS[status]}
                    </h3>
                    <motion.span
                        key={count}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="bg-white px-2 py-0.5 rounded-full text-xs font-medium"
                    >
                        {count}
                    </motion.span>
                </div>
            </div>

            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3 min-h-[120px]">
                    <AnimatePresence mode="popLayout">
                        {orders.length === 0 ? (
                            isDraggingOver ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "text-center py-12 text-base font-medium text-foreground transition-all duration-200"
                                    )}
                                >
                                    Solte aqui
                                </motion.div>
                            ) : null
                        ) : (
                            orders.map(order => (
                                <motion.div
                                    key={order.id}
                                    layout="position"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{
                                        opacity: activeOrderId === order.id ? 0 : 1,
                                        y: 0
                                    }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                    transition={{
                                        layout: { type: "spring", stiffness: 350, damping: 30 },
                                        opacity: { duration: 0.15 }
                                    }}
                                >
                                    <DraggableOrderCard
                                        order={order}
                                        onStatusChange={onStatusChange}
                                        onClick={() => onCardClick(order)}
                                        isUpdating={isUpdating}
                                    />
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>

                    {/* Drop zone indicator at the bottom when column has items */}
                    <AnimatePresence>
                        {isDraggingOver && orders.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 60 }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-2 border-dashed border-current rounded-lg flex items-center justify-center text-sm text-muted-foreground"
                            >
                                Solte aqui
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </div>
    );
}

export function OrderKanban({ orders, onStatusChange, isUpdating }: OrderKanbanProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const selectedOrder = useMemo(() =>
        orders.find(o => o.id === selectedOrderId) || null,
        [orders, selectedOrderId]);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    // Optimistic state: tracks pending status changes before backend confirms
    const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, OrderStatus>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 8,
            },
        })
    );

    // Apply optimistic updates to orders for immediate UI response
    const displayOrders = useMemo(() => {
        return orders.map(order => {
            const optimisticStatus = optimisticUpdates[order.id];
            if (optimisticStatus && optimisticStatus !== order.order_status) {
                return { ...order, order_status: optimisticStatus };
            }
            return order;
        });
    }, [orders, optimisticUpdates]);

    // Clear optimistic update when real data catches up
    useMemo(() => {
        const newOptimistic = { ...optimisticUpdates };
        let changed = false;
        for (const [orderId, status] of Object.entries(optimisticUpdates)) {
            const realOrder = orders.find(o => o.id === orderId);
            if (realOrder && realOrder.order_status === status) {
                delete newOptimistic[orderId];
                changed = true;
            }
        }
        if (changed) {
            setOptimisticUpdates(newOptimistic);
        }
    }, [orders]);

    const getOrdersByStatus = (status: OrderStatus) =>
        displayOrders.filter(order => order.order_status === status);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const order = displayOrders.find(o => o.id === active.id);
        if (order) {
            setActiveOrder(order);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveOrder(null);
            return;
        }

        const orderId = active.id as string;
        const newStatus = over.id as OrderStatus;
        const currentStatus = active.data.current?.currentStatus as OrderStatus;

        // Only update if status actually changed
        if (newStatus !== currentStatus && KANBAN_COLUMNS.some(col => col.status === newStatus)) {
            // Apply optimistic update IMMEDIATELY before clearing activeOrder
            setOptimisticUpdates(prev => ({ ...prev, [orderId]: newStatus }));
            // Then trigger the real update
            onStatusChange(orderId, newStatus);
        }

        // Clear active order after a tiny delay to let the optimistic state settle
        requestAnimationFrame(() => {
            setActiveOrder(null);
        });
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-4 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
                    {KANBAN_COLUMNS.map(({ status, color, dropColor }) => (
                        <DroppableColumn
                            key={status}
                            status={status}
                            color={color}
                            dropColor={dropColor}
                            orders={getOrdersByStatus(status)}
                            onStatusChange={onStatusChange}
                            onCardClick={(order) => setSelectedOrderId(order.id)}
                            isUpdating={isUpdating}
                            activeOrderId={activeOrder?.id}
                        />
                    ))}
                </div>

                <DragOverlay
                    dropAnimation={null}
                >
                    {activeOrder && (
                        <motion.div
                            initial={{ scale: 1, rotate: 0 }}
                            animate={{ scale: 1.03, rotate: 2 }}
                            className="shadow-2xl"
                        >
                            <OrderCard
                                order={activeOrder}
                                onStatusChange={onStatusChange}
                                isUpdating={isUpdating}
                            />
                        </motion.div>
                    )}
                </DragOverlay>
            </DndContext>

            <OrderDetailDialog
                order={selectedOrder}
                open={!!selectedOrderId}
                onOpenChange={(open) => !open && setSelectedOrderId(null)}
                onStatusChange={onStatusChange}
                isUpdating={isUpdating}
            />
        </>
    );
}

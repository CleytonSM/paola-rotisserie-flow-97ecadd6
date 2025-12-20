import { useState, useMemo } from "react";
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import { Order, OrderStatus } from "@/services/database";
import { OrderCard } from "../OrderCard";
import { OrderDetailDialog } from "../OrderDetailDialog";
import { motion } from "framer-motion";
import { DroppableColumn } from "./DroppableColumn";
import { KANBAN_COLUMNS } from "./kanban.constants";
import { OrderKanbanProps } from "./kanban.types";
import { MobileKanbanTabs } from "./MobileKanbanTabs";

export function OrderKanban({ orders, onStatusChange, isUpdating, filterType }: OrderKanbanProps) {
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
                delay: 0,
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

    const filteredOrders = useMemo(() => {
        if (filterType === 'all') return displayOrders;
        return displayOrders.filter(order => {
            if (filterType === 'delivery') return order.is_delivery;
            if (filterType === 'pickup') return !order.is_delivery;
            return true;
        });
    }, [displayOrders, filterType]);

    const getOrdersByStatus = (status: OrderStatus) =>
        filteredOrders.filter(order => order.order_status === status);

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
            {/* Desktop: 4-column Kanban with drag-and-drop */}
            <div className="hidden md:block">
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
                                className="h-full"
                            />
                        ))}
                    </div>

                    <DragOverlay dropAnimation={null}>
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
            </div>

            {/* Mobile: Tabs-based layout */}
            <div className="md:hidden overflow-x-hidden">
                <MobileKanbanTabs
                    orders={filteredOrders}
                    onStatusChange={onStatusChange}
                    isUpdating={isUpdating}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                />
            </div>
        </>
    );
}

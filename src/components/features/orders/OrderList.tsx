import { useState, useMemo } from "react";
import { Order, OrderStatus } from "@/services/database";
import { OrderCard } from "./OrderCard";
import { OrderDetailDialog } from "./OrderDetailDialog";

interface OrderListProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
}

export function OrderList({ orders, onStatusChange, isUpdating }: OrderListProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const selectedOrder = useMemo(() =>
        orders.find(o => o.id === selectedOrderId) || null,
        [orders, selectedOrderId]);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={onStatusChange}
                        onClick={() => setSelectedOrderId(order.id)}
                        isUpdating={isUpdating}
                    />
                ))}
            </div>

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


import { useState } from "react";
import { Order, OrderStatus } from "@/services/database";
import { OrderCard } from "./OrderCard";
import { OrderDetailDialog } from "./OrderDetailDialog";

interface OrderListProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
}

export function OrderList({ orders, onStatusChange, isUpdating }: OrderListProps) {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={onStatusChange}
                        onClick={() => setSelectedOrder(order)}
                        isUpdating={isUpdating}
                    />
                ))}
            </div>

            <OrderDetailDialog
                order={selectedOrder}
                open={!!selectedOrder}
                onOpenChange={(open) => !open && setSelectedOrder(null)}
                onStatusChange={onStatusChange}
                isUpdating={isUpdating}
            />
        </>
    );
}


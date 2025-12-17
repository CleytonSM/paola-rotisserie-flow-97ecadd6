import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Order, OrderStatus } from "@/services/database";
import { OrderCard } from "./OrderCard";
import { cn } from "@/lib/utils";

interface DraggableOrderCardProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    onClick?: () => void;
    isUpdating?: boolean;
}

export function DraggableOrderCard({
    order,
    onStatusChange,
    onClick,
    isUpdating,
}: DraggableOrderCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: {
            order,
            currentStatus: order.order_status,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? "none" : "transform 200ms ease",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "touch-none",
                isDragging && "z-50 opacity-90 cursor-grabbing scale-[1.02] shadow-2xl",
                !isDragging && "cursor-grab"
            )}
        >
            <OrderCard
                order={order}
                onStatusChange={onStatusChange}
                onClick={!isDragging ? onClick : undefined}
                isUpdating={isUpdating}
            />
        </div>
    );
}

import { Order, OrderStatus } from "@/services/database";

export interface KanbanColumn {
    status: OrderStatus;
    color: string;
    dropColor: string;
}

export interface OrderKanbanProps {
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
    filterType: 'all' | 'delivery' | 'pickup';
}

export interface DroppableColumnProps {
    status: OrderStatus;
    color: string;
    dropColor: string;
    orders: Order[];
    onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
    onCardClick: (order: Order) => void;
    isUpdating?: boolean;
    activeOrderId?: string | null;
    className?: string;
}

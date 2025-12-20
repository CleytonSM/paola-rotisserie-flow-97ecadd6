import { useDroppable } from "@dnd-kit/core";
import { ORDER_STATUS_LABELS } from "@/services/database";
import { DraggableOrderCard } from "../DraggableOrderCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DroppableColumnProps } from "./kanban.types";

export function DroppableColumn({
    status,
    color,
    dropColor,
    orders,
    onStatusChange,
    onCardClick,
    isUpdating,
    activeOrderId,
    className,
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
                isDraggingOver && `ring-2 ring-offset-2 ${dropColor}`,
                className
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

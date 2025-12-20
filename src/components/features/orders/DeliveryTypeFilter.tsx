import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DeliveryFilterType = 'all' | 'pickup' | 'delivery';

interface DeliveryTypeFilterProps {
    value: DeliveryFilterType;
    onChange: (value: DeliveryFilterType) => void;
    className?: string;
}

const OPTIONS: { value: DeliveryFilterType; label: string }[] = [
    { value: 'pickup', label: 'Retirada' },
    { value: 'all', label: 'Todos' },
    { value: 'delivery', label: 'Entrega' },
];

export function DeliveryTypeFilter({ value, onChange, className }: DeliveryTypeFilterProps) {
    return (
        <div className={cn("p-1 bg-muted/30 rounded-full inline-flex relative", className)}>
            {OPTIONS.map((option) => {
                const isSelected = value === option.value;

                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors z-10",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="activeFilter"
                                className="absolute inset-0 bg-primary rounded-full shadow-sm -z-10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

import { LucideIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodCardProps {
    id: string;
    title: string;
    icon: LucideIcon;
    selected: boolean;
    onClick: () => void;
    children?: React.ReactNode;
}

export function PaymentMethodCard({
    id,
    title,
    icon: Icon,
    selected,
    onClick,
    children,
}: PaymentMethodCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                selected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/50 hover:bg-accent"
            )}
        >
            <div className="flex items-center gap-3 mb-2">
                <div
                    className={cn(
                        "p-2 rounded-lg",
                        selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className={cn("font-medium text-lg", selected ? "text-primary" : "text-foreground")}>
                    {title}
                </h3>
                {selected && (
                    <CheckCircle2 className="ml-auto h-6 w-6 text-green-500 fill-green-100 dark:fill-green-900" />
                )}
            </div>

            {children && (
                <div className="mt-2 pl-1">
                    {children}
                </div>
            )}
        </div>
    );
}

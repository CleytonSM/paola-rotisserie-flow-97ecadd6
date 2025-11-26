import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";

interface DataTableActionProps extends React.ComponentProps<typeof Button> {
    tooltip: string;
    icon?: LucideIcon;
}

export const DataTableAction = forwardRef<HTMLButtonElement, DataTableActionProps>(
    ({ tooltip, icon: Icon, className, children, ...props }, ref) => {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        ref={ref}
                        size="icon"
                        variant="ghost"
                        className={cn("h-8 w-8 text-muted-foreground", className)}
                        {...props}
                    >
                        {Icon ? <Icon className="h-4 w-4" /> : children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        );
    }
);
DataTableAction.displayName = "DataTableAction";

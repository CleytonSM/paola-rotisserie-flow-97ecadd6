import * as React from "react";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { cn } from "@/lib/utils";

interface BrandedScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollArea> {
    thumbColor?: "primary" | "secondary" | "muted";
}

export function BrandedScrollArea({
    children,
    className,
    thumbColor = "primary",
    ...props
}: BrandedScrollAreaProps) {
    const thumbStyles = {
        primary: "bg-primary/40 hover:bg-primary/60",
        secondary: "bg-secondary/40 hover:bg-secondary/60",
        muted: "bg-muted-foreground/20 hover:bg-muted-foreground/30"
    };

    return (
        <ScrollArea className={cn("relative", className)} {...props}>
            <div className="pr-3">
                {children}
            </div>
            <ScrollBar
                thumbClassName={cn("w-1.5 transition-all duration-300", thumbStyles[thumbColor])}
                className="w-2"
            />
        </ScrollArea>
    );
}

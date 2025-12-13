import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    title: string;
    description: string;
    variant: "primary" | "secondary";
}

export function ActionButton({ onClick, icon: Icon, title, description, variant }: ActionButtonProps) {
    const variantStyles = {
        primary: "border-primary hover:bg-primary/10 focus:ring-primary text-primary-hover",
        secondary: "border-secondary hover:bg-secondary/10 focus:ring-secondary text-secondary"
    };

    const iconColor = variant === "primary" ? "text-primary-hover" : "text-secondary";
    const textColor = variant === "primary" ? "text-primary-hover" : "text-secondary";

    return (
        <button
            onClick={onClick}
            className={`group w-full rounded-xl border-2 ${variantStyles[variant]} p-4 text-left transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background`}
        >
            <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${iconColor}`} />
                <div>
                    <p className={`font-semibold ${textColor}`}>{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </button>
    );
}

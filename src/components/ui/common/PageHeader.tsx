import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children?: ReactNode;
}

export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
    return (
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
                <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-2 text-lg text-muted-foreground">
                        {subtitle}
                    </p>
                )}
                {children && <div className="mt-2">{children}</div>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

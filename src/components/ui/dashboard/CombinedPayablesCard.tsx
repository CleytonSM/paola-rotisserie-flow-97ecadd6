import { AlertCircle } from "lucide-react";

interface CombinedPayablesCardProps {
    unpaidCount: number;
    overdueCount: number;
}

export function CombinedPayablesCard({ unpaidCount, overdueCount }: CombinedPayablesCardProps) {
    return (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Contas a Pagar</span>
                    <span className="flex items-center gap-1.5 font-sans text-lg font-semibold text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        {unpaidCount}
                    </span>
                </div>

                <div className="border-t border-border" />

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Contas Vencidas</span>
                    <span className="flex items-center gap-1.5 font-sans text-lg font-semibold text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {overdueCount}
                    </span>
                </div>
            </div>
        </div>
    );
}
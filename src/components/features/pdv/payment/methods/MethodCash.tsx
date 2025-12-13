import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";

interface MethodCashProps {
    amountGiven: string;
    setAmountGiven: (amount: string) => void;
    change: number;
}

export function MethodCash({ amountGiven, setAmountGiven, change }: MethodCashProps) {
    return (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase">Valor Recebido</label>
                <Input
                    placeholder="R$ 0,00"
                    value={amountGiven}
                    onChange={(e) => setAmountGiven(e.target.value)}
                    className="border-sidebar-border focus:border-primary focus:ring-primary/20"
                />
            </div>
            {parseFloat(amountGiven) > 0 && (
                <div className="flex justify-between items-center p-3 bg-sidebar-accent/50 rounded-lg border border-sidebar-border border-dashed">
                    <span className="text-sm font-medium text-muted-foreground">Troco</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(change)}</span>
                </div>
            )}
        </div>
    );
}

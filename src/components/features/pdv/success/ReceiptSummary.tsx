
import { formatCurrency } from "@/utils/format";

interface ReceiptSummaryProps {
    displayId: string;
    clientName?: string;
    paymentMethod: string;
    total: number;
}

export function ReceiptSummary({ displayId, clientName, paymentMethod, total }: ReceiptSummaryProps) {
    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'card_credit': return 'Crédito';
            case 'card_debit': return 'Débito';
            case 'pix': return 'Pix';
            case 'cash':
            case 'money': return 'Dinheiro';
            case 'multiple': return 'Múltiplos Métodos';
            default: return method;
        }
    };

    return (
        <div className="bg-muted/50 rounded-2xl p-6 mb-8 space-y-4 text-left border border-border">
            <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground text-sm font-medium">Venda</span>
                <span className="font-mono font-bold text-xl text-foreground tracking-tight">{displayId}</span>
            </div>

            {clientName && (
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm font-medium">Cliente</span>
                    <span className="font-semibold text-foreground">{clientName}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-medium">Pagamento</span>
                <span className="capitalize font-semibold text-foreground bg-card px-3 py-1 rounded-full border border-border shadow-sm text-sm">
                    {formatPaymentMethod(paymentMethod)}
                </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="text-muted-foreground text-sm font-medium">Valor Total</span>
                <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{formatCurrency(total || 0)}</span>
            </div>
        </div>
    );
}

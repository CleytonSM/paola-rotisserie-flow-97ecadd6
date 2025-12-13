
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
        <div className="bg-stone-50/80 rounded-2xl p-6 mb-8 space-y-4 text-left border border-stone-100/50">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                <span className="text-stone-500 text-sm font-medium">Venda</span>
                <span className="font-mono font-bold text-xl text-stone-700 tracking-tight">{displayId}</span>
            </div>

            {clientName && (
                <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-sm font-medium">Cliente</span>
                    <span className="font-semibold text-stone-700">{clientName}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                <span className="text-stone-500 text-sm font-medium">Pagamento</span>
                <span className="capitalize font-semibold text-stone-700 bg-white px-3 py-1 rounded-full border border-stone-100 shadow-sm text-sm">
                    {formatPaymentMethod(paymentMethod)}
                </span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-stone-200/50">
                <span className="text-stone-500 text-sm font-medium">Valor Total</span>
                <span className="font-bold text-2xl text-emerald-600">{formatCurrency(total || 0)}</span>
            </div>
        </div>
    );
}

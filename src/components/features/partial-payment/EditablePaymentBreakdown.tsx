import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/common/money-input";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaymentEntry } from "./PartialPaymentBuilder";

interface EditablePaymentBreakdownProps {
    paymentEntries: PaymentEntry[];
    onUpdateEntry: (id: string, amount: number) => void;
    onRemoveEntry: (id: string) => void;
    totalAmount: number;
    onTotalChange: (newTotal: number) => void;
    disabled?: boolean;
}

export function EditablePaymentBreakdown({
    paymentEntries,
    onUpdateEntry,
    onRemoveEntry,
    totalAmount,
    onTotalChange,
    disabled = false
}: EditablePaymentBreakdownProps) {
    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            'pix': 'Pix',
            'cash': 'Dinheiro',
            'card_credit': 'Cartão de Crédito',
            'card_debit': 'Cartão de Débito',
            'card': 'Cartão',
            'boleto': 'Boleto'
        };
        return labels[method] || method;
    };

    const currentTotal = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const isBalanced = Math.abs(currentTotal - totalAmount) < 0.01;

    const handleTotalChange = (newTotal: number) => {
        if (paymentEntries.length === 0) {
            onTotalChange(newTotal);
            return;
        }

        // Distribute the new total proportionally across existing payments
        const oldTotal = currentTotal;
        const ratio = oldTotal > 0 ? newTotal / oldTotal : 1;

        paymentEntries.forEach(entry => {
            const newAmount = entry.amount * ratio;
            onUpdateEntry(entry.id, newAmount);
        });

        onTotalChange(newTotal);
    };

    const handleAmountChange = (entryId: string, newAmount: number) => {
        onUpdateEntry(entryId, newAmount);
        // Update total to reflect the change
        const newTotal = paymentEntries.reduce((sum, entry) =>
            entry.id === entryId ? sum + newAmount : sum + entry.amount, 0
        );
        onTotalChange(newTotal);
    };

    return (
        <div className="space-y-4">
            {/* Total Amount Field */}
            <div className="space-y-2">
                <Label>Valor Bruto Total (R$)</Label>
                <MoneyInput
                    value={totalAmount}
                    onChange={(val) => handleTotalChange(parseFloat(val) || 0)}
                    disabled={disabled}
                    className={!isBalanced ? "border-orange-500" : ""}
                />
                {!isBalanced && (
                    <p className="text-xs text-orange-600">
                        Atenção: Total não corresponde à soma dos pagamentos (R$ {currentTotal.toFixed(2)})
                    </p>
                )}
            </div>

            {/* Payment Entries */}
            {paymentEntries.length > 0 && (
                <div className="space-y-2">
                    <Label>Divisão de Pagamento</Label>
                    <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                        {paymentEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center gap-3 bg-white border rounded-lg p-3"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-sm">
                                        {getMethodLabel(entry.method)}
                                    </div>
                                    {entry.details?.cardBrand && (
                                        <div className="text-xs text-muted-foreground">
                                            {entry.details.cardBrand}
                                        </div>
                                    )}
                                </div>
                                <MoneyInput
                                    value={entry.amount}
                                    onChange={(val) => handleAmountChange(entry.id, parseFloat(val) || 0)}
                                    disabled={disabled}
                                    className="w-32 text-right"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveEntry(entry.id)}
                                    disabled={disabled || paymentEntries.length === 1}
                                    className="shrink-0"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span className={isBalanced ? "text-emerald-600" : "text-orange-600"}>
                                R$ {currentTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { formatPixKey } from "@/lib/masks";

export interface PaymentEntry {
    id: string;
    method: string;
    amount: number;
    details?: {
        pixKeyId?: string;
        machineId?: string;
        flagId?: string;
        cardBrand?: string;
    };
}

interface PixKey {
    id: string;
    type: string;
    key_value: string;
}

interface PartialPaymentBuilderProps {
    totalAmount: number;
    paymentEntries: PaymentEntry[];
    onAddEntry: (entry: PaymentEntry) => void;
    onRemoveEntry: (id: string) => void;
    disabled?: boolean;
    pixKeys?: PixKey[];
}

export function PartialPaymentBuilder({
    totalAmount,
    paymentEntries,
    onAddEntry,
    onRemoveEntry,
    disabled = false,
    pixKeys = []
}: PartialPaymentBuilderProps) {
    const [selectedMethod, setSelectedMethod] = useState<string>("");
    const [entryAmount, setEntryAmount] = useState<string>("");
    const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>("");

    const getTotalAllocated = () => {
        return paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
    };

    const getRemainingBalance = () => {
        return totalAmount - getTotalAllocated();
    };

    // Calculate change from cash overpayment
    const getChangeAmount = () => {
        const remaining = getRemainingBalance();
        if (remaining < 0) {
            // Check if any cash entry caused the overpayment
            const hasCash = paymentEntries.some(e => e.method === 'cash');
            if (hasCash) return Math.abs(remaining);
        }
        return 0;
    };

    const handleAddEntry = () => {
        if (!selectedMethod || !entryAmount) return;
        // Require pix key selection if method is pix
        if (selectedMethod === 'pix' && !selectedPixKeyId && pixKeys.length > 0) return;

        const amount = parseFloat(entryAmount);
        if (isNaN(amount) || amount <= 0) return;

        const remaining = getRemainingBalance();
        // For cash, allow exceeding the remaining (for change/troco)
        // For other methods, don't allow exceeding
        if (selectedMethod !== 'cash' && amount > remaining + 0.01) {
            return; // Don't add if exceeds remaining (allow small floating point tolerance)
        }

        const entry: PaymentEntry = {
            id: crypto.randomUUID(),
            method: selectedMethod,
            amount: amount,
            details: selectedMethod === 'pix' && selectedPixKeyId ? { pixKeyId: selectedPixKeyId } : undefined
        };

        onAddEntry(entry);
        setSelectedMethod("");
        setEntryAmount("");
        setSelectedPixKeyId("");
    };

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

    // Consider complete if remaining is 0, OR if negative (overpaid) and there's cash
    const remaining = getRemainingBalance();
    const changeAmount = getChangeAmount();
    const isComplete = Math.abs(remaining) < 0.01 || (remaining < 0 && changeAmount > 0);

    return (
        <Card className="border-2">
            <CardHeader>
                <CardTitle className="text-base">Pagamentos Parciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary */}
                <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Alocado:</span>
                        <span className="font-medium">{formatCurrency(getTotalAllocated())}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                        <span className="text-muted-foreground">Restante:</span>
                        <span className={`font-bold ${isComplete ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {formatCurrency(Math.max(0, remaining))}
                        </span>
                    </div>
                    {changeAmount > 0 && (
                        <div className="flex justify-between border-t pt-1">
                            <span className="text-muted-foreground font-medium">Troco:</span>
                            <span className="font-bold text-primary">
                                {formatCurrency(changeAmount)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Payment Entries List */}
                {paymentEntries.length > 0 && (
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Métodos de Pagamento</Label>
                        {paymentEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between bg-white border rounded-lg p-3"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{getMethodLabel(entry.method)}</div>
                                    <div className="text-xs text-muted-foreground">{formatCurrency(entry.amount)}</div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveEntry(entry.id)}
                                    disabled={disabled}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Entry */}
                {!isComplete && (
                    <div className="border-t pt-4 space-y-3">
                        <Label className="text-sm">Adicionar Pagamento</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Método</Label>
                                <Select
                                    value={selectedMethod}
                                    onValueChange={setSelectedMethod}
                                    disabled={disabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pix">Pix</SelectItem>
                                        <SelectItem value="cash">Dinheiro</SelectItem>
                                        <SelectItem value="card_credit">Cartão Crédito</SelectItem>
                                        <SelectItem value="card_debit">Cartão Débito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={entryAmount}
                                    onChange={(e) => setEntryAmount(e.target.value)}
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        {/* Pix Key Selection - only shown when method is pix */}
                        {selectedMethod === 'pix' && pixKeys.length > 0 && (
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Chave Pix</Label>
                                <Select
                                    value={selectedPixKeyId}
                                    onValueChange={setSelectedPixKeyId}
                                    disabled={disabled}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a chave" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pixKeys.map((key) => (
                                            <SelectItem key={key.id} value={key.id}>
                                                {formatPixKey(key.type, key.key_value)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleAddEntry}
                            disabled={!selectedMethod || !entryAmount || (selectedMethod === 'pix' && pixKeys.length > 0 && !selectedPixKeyId) || disabled}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>
                )}

                {isComplete && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <span className="text-sm text-emerald-700 font-medium">
                            ✓ Valor total alocado
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/common/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { formatPixKey } from "@/lib/masks";
import type { PixKey } from "@/services/database/pix_keys";

export interface PaymentEntry {
    id: string;
    method: string;
    amount: number;
    details?: {
        pixKeyId?: string;
        machineId?: string;
        cardBrand?: string;
        tax_rate?: number;
    };
}

interface PartialPaymentBuilderProps {
    totalAmount: number;
    paymentEntries: PaymentEntry[];
    onAddEntry: (entry: PaymentEntry) => void;
    onRemoveEntry: (id: string) => void;
    disabled?: boolean;
    pixKeys?: PixKey[];
    machines?: any[];
}

export function PartialPaymentBuilder({
    totalAmount,
    paymentEntries,
    onAddEntry,
    onRemoveEntry,
    disabled = false,
    pixKeys = [],
    machines = []
}: PartialPaymentBuilderProps) {
    const [selectedMethod, setSelectedMethod] = useState<string>("");
    const [entryAmount, setEntryAmount] = useState<string>("");
    const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>("");
    const [selectedMachineId, setSelectedMachineId] = useState<string>("");
    const [selectedCardBrand, setSelectedCardBrand] = useState<string>("");

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

        const currentMachine = machines.find(m => m.id === selectedMachineId);
        const currentFlag = currentMachine?.flags?.find((f: any) => f.brand === selectedCardBrand && f.type === (selectedMethod === 'card_credit' ? 'credit' : 'debit'));

        const entry: PaymentEntry = {
            id: crypto.randomUUID(),
            method: selectedMethod,
            amount: amount,
            details: {
                pixKeyId: selectedMethod === 'pix' ? selectedPixKeyId : undefined,
                machineId: (selectedMethod === 'card_credit' || selectedMethod === 'card_debit') ? selectedMachineId : undefined,
                cardBrand: (selectedMethod === 'card_credit' || selectedMethod === 'card_debit') ? selectedCardBrand : undefined,
                tax_rate: currentFlag?.tax_rate
            }
        };

        onAddEntry(entry);
        setSelectedMethod("");
        setEntryAmount("");
        setSelectedPixKeyId("");
        setSelectedMachineId("");
        setSelectedCardBrand("");
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
                                className="flex items-center justify-between bg-card border rounded-lg p-3"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-sm">
                                        {getMethodLabel(entry.method)}
                                        {entry.details?.cardBrand && (
                                            <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                                {entry.details.cardBrand}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatCurrency(entry.amount)}
                                        {entry.details?.tax_rate ? (
                                            <span className="ml-1 text-red-500">
                                                (+{entry.details.tax_rate}%)
                                            </span>
                                        ) : null}
                                    </div>
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
                                <MoneyInput
                                    placeholder="0,00"
                                    value={entryAmount}
                                    onChange={(val) => setEntryAmount(val)}
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        {/* Card Machine Selection */}
                        {(selectedMethod === 'card_credit' || selectedMethod === 'card_debit') && machines.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Maquininha</Label>
                                    <Select
                                        value={selectedMachineId}
                                        onValueChange={(val) => {
                                            setSelectedMachineId(val);
                                            setSelectedCardBrand("");
                                        }}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {machines.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Bandeira</Label>
                                    <Select
                                        value={selectedCardBrand}
                                        onValueChange={setSelectedCardBrand}
                                        disabled={!selectedMachineId || disabled}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {machines
                                                .find(m => m.id === selectedMachineId)
                                                ?.flags
                                                ?.filter((f: any) => f.type === (selectedMethod === 'card_credit' ? 'credit' : 'debit'))
                                                .map((f: any) => (
                                                    <SelectItem key={f.id} value={f.brand}>
                                                        {f.brand} ({f.tax_rate}%)
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleAddEntry}
                            disabled={
                                !selectedMethod ||
                                !entryAmount ||
                                (selectedMethod === 'pix' && pixKeys.length > 0 && !selectedPixKeyId) ||
                                ((selectedMethod === 'card_credit' || selectedMethod === 'card_debit') && (!selectedMachineId || !selectedCardBrand)) ||
                                disabled
                            }
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                        </Button>
                    </div>
                )}

                {isComplete && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
                        <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                            ✓ Valor total alocado
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

import { useState } from "react";

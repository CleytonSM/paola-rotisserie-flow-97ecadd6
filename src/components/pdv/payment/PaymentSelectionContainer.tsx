
import { PaymentMethods } from "./PaymentMethods";
import { PartialPaymentBuilder } from "@/components/features/partial-payment/PartialPaymentBuilder";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { usePayment } from "@/hooks/usePayment";

interface PaymentSelectionContainerProps {
    paymentState: ReturnType<typeof usePayment>;
}

export function PaymentSelectionContainer({ paymentState }: PaymentSelectionContainerProps) {
    const {
        calculateTotalWithFees,
        total,
        isPartialPayment,
        setIsPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,
        isProcessing,
        pixKeys,
        selectedMethod,
        setSelectedMethod,
        selectedPixKey,
        setSelectedPixKey,
        setShowPixModal,
        amountGiven,
        setAmountGiven,
        calculateChange,
        machines,
        selectedMachine,
        setSelectedMachine,
        selectedFlag,
        setSelectedFlag,
        handleConfirm,
        getRemainingBalance
    } = paymentState;

    return (
        <div className="space-y-6">
            {/* Partial Payment Toggle */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-sidebar-border">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="partial-payment"
                        checked={isPartialPayment}
                        onCheckedChange={(checked) => setIsPartialPayment(checked as boolean)}
                    />
                    <Label
                        htmlFor="partial-payment"
                        className="text-sm font-medium cursor-pointer"
                    >
                        Habilitar pagamento parcial (múltiplos métodos)
                    </Label>
                </div>
            </div>

            {/* Conditional Rendering based on payment mode */}
            {isPartialPayment ? (
                <PartialPaymentBuilder
                    totalAmount={calculateTotalWithFees()}
                    paymentEntries={paymentEntries}
                    onAddEntry={addPaymentEntry}
                    onRemoveEntry={removePaymentEntry}
                    disabled={isProcessing}
                    pixKeys={pixKeys}
                />
            ) : (
                <PaymentMethods
                    selectedMethod={selectedMethod}
                    setSelectedMethod={setSelectedMethod}
                    pixKeys={pixKeys}
                    selectedPixKey={selectedPixKey}
                    setSelectedPixKey={setSelectedPixKey}
                    onGenerateQRCode={() => setShowPixModal(true)}
                    amountGiven={amountGiven}
                    setAmountGiven={setAmountGiven}
                    change={calculateChange()}
                    machines={machines}
                    selectedMachine={selectedMachine}
                    setSelectedMachine={setSelectedMachine}
                    selectedFlag={selectedFlag}
                    setSelectedFlag={setSelectedFlag}
                    totalWithFees={calculateTotalWithFees()}
                    originalTotal={total()}
                    isProcessing={isProcessing}
                    onConfirm={handleConfirm}
                />
            )}

            {/* Generate Pix QR Code Button for Partial Payment with Pix */}
            {isPartialPayment && paymentEntries.some(e => e.method === 'pix') && pixKeys.length > 0 && (
                <Button
                    variant="outline"
                    className="w-full h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setShowPixModal(true)}
                >
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code Pix
                </Button>
            )}

            {/* Confirm Button for Partial Payment Mode */}
            {isPartialPayment && (() => {
                const remaining = getRemainingBalance();
                // Allow if fully paid (remaining ~0) OR overpaid with cash for change
                const hasCashOverpayment = remaining < -0.01 && paymentEntries.some(e => e.method === 'cash');
                const isComplete = Math.abs(remaining) < 0.01 || hasCashOverpayment;
                return (
                    <button
                        className="w-full h-16 text-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isComplete || paymentEntries.length === 0 || isProcessing}
                        onClick={handleConfirm}
                    >
                        {isProcessing ? "Processando..." : "Confirmar e Cobrar"}
                    </button>
                );
            })()}
        </div>
    );
}

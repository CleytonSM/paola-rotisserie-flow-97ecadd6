import { usePayment } from "@/hooks/usePayment";
import { QRCodeModal } from "@/components/pdv/QRCodeModal";
import { PaymentHeader } from "@/components/pdv/payment/PaymentHeader";
import { PaymentSummary } from "@/components/pdv/payment/PaymentSummary";
import { PaymentMethods } from "@/components/pdv/payment/PaymentMethods";
import { ClientSearch } from "@/components/pdv/payment/ClientSearch";
import { PartialPaymentBuilder } from "@/components/ui/partial-payment/PartialPaymentBuilder";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export default function PaymentPage() {
    const {
        items,
        total,
        selectedMethod,
        setSelectedMethod,
        notes,
        setNotes,
        isProcessing,
        showPixModal,
        setShowPixModal,
        pixKeys,
        machines,
        selectedPixKey,
        setSelectedPixKey,
        selectedMachine,
        setSelectedMachine,
        selectedFlag,
        setSelectedFlag,
        amountGiven,
        setAmountGiven,
        calculateTotalWithFees,
        calculateChange,
        handleConfirm,
        selectedClient,
        setSelectedClient,
        isPartialPayment,
        setIsPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,
        getTotalAllocated,
        getRemainingBalance
    } = usePayment();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PaymentHeader />

            <div className="flex-1 p-6 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Summary */}
                <div className="space-y-6">
                    <ClientSearch
                        selectedClient={selectedClient}
                        onSelectClient={setSelectedClient}
                    />
                    <PaymentSummary
                        items={items}
                        subtotal={total()}
                        total={calculateTotalWithFees()}
                        notes={notes}
                        setNotes={setNotes}
                    />
                </div>

                {/* Right Column: Payment Methods */}
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
            </div>

            <QRCodeModal
                open={showPixModal}
                onOpenChange={setShowPixModal}
                pixKey={
                    isPartialPayment
                        ? (pixKeys.find(k => k.id === paymentEntries.find(e => e.method === 'pix')?.details?.pixKeyId)?.key_value || pixKeys[0]?.key_value || "")
                        : (pixKeys.find(k => k.id === selectedPixKey)?.key_value || "")
                }
                amount={
                    isPartialPayment
                        ? (paymentEntries.find(e => e.method === 'pix')?.amount || 0)
                        : calculateTotalWithFees()
                }
            />
        </div>
    );
}

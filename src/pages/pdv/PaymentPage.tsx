import { usePayment } from "@/hooks/usePayment";
import { QRCodeModal } from "@/components/pdv/QRCodeModal";
import { PaymentHeader } from "@/components/pdv/payment/PaymentHeader";
import { PaymentSummary } from "@/components/pdv/payment/PaymentSummary";
import { PaymentMethods } from "@/components/pdv/payment/PaymentMethods";

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
        handleConfirm
    } = usePayment();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PaymentHeader />

            <div className="flex-1 p-6 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Summary */}
                <PaymentSummary
                    items={items}
                    subtotal={total()}
                    total={calculateTotalWithFees()}
                    notes={notes}
                    setNotes={setNotes}
                />

                {/* Right Column: Payment Methods */}
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
            </div>

            <QRCodeModal
                open={showPixModal}
                onOpenChange={setShowPixModal}
                value={selectedPixKey}
                amount={calculateTotalWithFees()}
            />
        </div>
    );
}

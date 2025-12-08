import { usePayment } from "@/hooks/usePayment";
import { QRCodeModal } from "@/components/pdv/QRCodeModal";
import { PaymentHeader } from "@/components/pdv/payment/PaymentHeader";
import { PaymentSummary } from "@/components/pdv/payment/PaymentSummary";
import { PaymentMethods } from "@/components/pdv/payment/PaymentMethods";

import { ClientSearch } from "@/components/pdv/payment/ClientSearch";

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
        setSelectedClient
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
                pixKey={selectedPixKey}
                amount={calculateTotalWithFees()}
            />
        </div>
    );
}

import { usePayment } from "@/hooks/usePayment";
import { PaymentHeader } from "@/components/features/pdv/payment/PaymentHeader";
import { PaymentSummary } from "@/components/features/pdv/payment/PaymentSummary";
import { PaymentSelectionContainer } from "@/components/features/pdv/payment/PaymentSelectionContainer";
import { ClientSearch } from "@/components/features/pdv/payment/ClientSearch";
import { QrCode } from "lucide-react";
import { QRCodeModal } from "@/components/features/pdv/QRCodeModal";

export default function PaymentPage() {
    const paymentState = usePayment();
    const {
        items,
        total,
        selectedClient,
        setSelectedClient,
        notes,
        setNotes,
        calculateTotalWithFees,
        paymentEntries,
        isPartialPayment,
        pixKeys,
        selectedPixKey,
        showPixModal,
        setShowPixModal
    } = paymentState;

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
                <PaymentSelectionContainer paymentState={paymentState} />

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

import { usePayment } from "@/hooks/usePayment";
import { PaymentHeader } from "@/components/features/pdv/payment/PaymentHeader";
import { PaymentSummary } from "@/components/features/pdv/payment/PaymentSummary";
import { PaymentSelectionContainer } from "@/components/features/pdv/payment/PaymentSelectionContainer";
import { ClientSearch } from "@/components/features/pdv/payment/ClientSearch";
import { QrCode } from "lucide-react";
import { QRCodeModal } from "@/components/features/pdv/QRCodeModal";
import { ScheduledPickupPicker } from "@/components/features/orders/ScheduledPickupPicker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Bike } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { ClientAddressDialog } from "@/components/features/clients/ClientAddressDialog";
import { useState, useEffect } from "react";
import { ClientAddress } from "@/types/entities";
import { applyCurrencyMask } from "@/lib/masks";

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
        setShowPixModal,
        scheduledPickup,
        setScheduledPickup,
        isDelivery,
        setIsDelivery,
        deliveryAddressId,
        setDeliveryAddressId,
        deliveryFee,
        setDeliveryFee
    } = paymentState;

    const { addresses } = useClientAddresses(selectedClient?.id);
    const [showAddressDialog, setShowAddressDialog] = useState(false);

    useEffect(() => {
        // Auto-select default address
        if (isDelivery && addresses.length > 0 && !deliveryAddressId) {
            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
            setDeliveryAddressId(defaultAddr.id);
        }
    }, [isDelivery, addresses, deliveryAddressId, setDeliveryAddressId]);

    useEffect(() => {
        const hasScheduledItems = items.some(item =>
            item.is_internal && item.subItems?.some(sub => sub.id === item.id)
        );

        if (hasScheduledItems && !scheduledPickup) {
            setScheduledPickup(new Date());
        }
    }, [items, scheduledPickup, setScheduledPickup]);

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
                    {/* Delivery Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-sidebar-border space-y-4">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="is-delivery"
                                checked={isDelivery}
                                onCheckedChange={(checked) => setIsDelivery(checked as boolean)}
                                disabled={!selectedClient}
                            />
                            <Label
                                htmlFor="is-delivery"
                                className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                                <Bike className="w-4 h-4 text-primary" />
                                É entrega?
                            </Label>
                        </div>

                        {!selectedClient && <p className="text-xs text-muted-foreground">Selecione um cliente para habilitar entrega.</p>}

                        {isDelivery && selectedClient && (
                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label>Endereço de Entrega</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={deliveryAddressId || ""}
                                            onValueChange={setDeliveryAddressId}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Selecione um endereço" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {addresses.map((addr: ClientAddress) => (
                                                    <SelectItem key={addr.id} value={addr.id}>
                                                        {addr.street}, {addr.number} {addr.complement ? `(${addr.complement})` : ''} - {addr.neighborhood}
                                                    </SelectItem>
                                                ))}
                                                {addresses.length === 0 && <SelectItem value="none" disabled>Nenhum endereço cadastrado</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                        <Button size="icon" variant="outline" onClick={() => setShowAddressDialog(true)}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Taxa de Entrega (R$)</Label>
                                    <Input
                                        type="text"
                                        placeholder="R$ 0,00"
                                        value={applyCurrencyMask((deliveryFee || 0).toFixed(2).replace('.', ''))}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            const numericValue = Number(rawValue) / 100;
                                            setDeliveryFee(numericValue);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <ScheduledPickupPicker
                        value={scheduledPickup}
                        onChange={setScheduledPickup}
                        label={isDelivery ? "Agendar Entrega" : "Agendar Retirada"}
                    />

                    <ClientAddressDialog
                        open={showAddressDialog}
                        onOpenChange={setShowAddressDialog}
                        clientId={selectedClient?.id || ""}
                    />

                    <PaymentSummary
                        items={items}
                        subtotal={total()}
                        total={calculateTotalWithFees()}
                        notes={notes}
                        setNotes={setNotes}
                        isDelivery={isDelivery}
                        deliveryFee={deliveryFee}
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


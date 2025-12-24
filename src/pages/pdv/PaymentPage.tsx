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
                    <div className="bg-card p-6 rounded-xl shadow-sm border border-sidebar-border space-y-4">
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="is-delivery"
                                checked={isDelivery}
                                onCheckedChange={(checked) => setIsDelivery(checked as boolean)}
                            />
                            <Label
                                htmlFor="is-delivery"
                                className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                                <Bike className="w-4 h-4 text-primary" />
                                É entrega?
                            </Label>
                        </div>


                        {isDelivery && (
                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                                {/* Delivery Address Selection or Manual Entry */}
                                {selectedClient && addresses.length > 0 ? (
                                    <div className="space-y-2">
                                        <Label>Endereço de Entrega</Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={deliveryAddressId || "manual"}
                                                onValueChange={(val) => {
                                                    if (val === "manual") {
                                                        setDeliveryAddressId(null);
                                                    } else {
                                                        setDeliveryAddressId(val);
                                                    }
                                                }}
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
                                                    <SelectItem value="manual">
                                                        Outro Endereço (Manual)
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button size="icon" variant="outline" onClick={() => setShowAddressDialog(true)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {selectedClient ?
                                                "Cliente sem endereços. Preencha a entrega:" :
                                                "Preencha o endereço de entrega:"}
                                        </span>
                                    </div>
                                )}

                                {(!deliveryAddressId) && (
                                    <div className="space-y-3 border-t pt-3 p-3 bg-muted/30 rounded-lg">
                                        <div className="grid grid-cols-[120px_1fr] gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">CEP</Label>
                                                <div className="relative">
                                                    <Input
                                                        className="h-9"
                                                        placeholder="00000-000"
                                                        value={paymentState.manualAddress.zipCode}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                                                            const formatted = val.replace(/^(\d{5})(\d)/, "$1-$2");
                                                            paymentState.setManualAddress(prev => ({ ...prev, zipCode: formatted }));

                                                            if (val.length === 8) {
                                                                fetch(`https://viacep.com.br/ws/${val}/json/`)
                                                                    .then(res => res.json())
                                                                    .then(data => {
                                                                        if (!data.erro) {
                                                                            paymentState.setManualAddress(prev => ({
                                                                                ...prev,
                                                                                street: data.logradouro,
                                                                                neighborhood: data.bairro,
                                                                                city: data.localidade,
                                                                                state: data.uf,
                                                                                complement: prev.complement || data.complemento
                                                                            }));
                                                                        }
                                                                    })
                                                                    .catch(() => { });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Rua</Label>
                                                <Input
                                                    className="h-9"
                                                    placeholder="Rua..."
                                                    value={paymentState.manualAddress.street}
                                                    onChange={e => paymentState.setManualAddress(prev => ({ ...prev, street: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[80px_1fr] gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Número</Label>
                                                <Input
                                                    className="h-9"
                                                    placeholder="123"
                                                    value={paymentState.manualAddress.number}
                                                    onChange={e => paymentState.setManualAddress(prev => ({ ...prev, number: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Complemento</Label>
                                                <Input
                                                    className="h-9"
                                                    placeholder="Apto 101..."
                                                    value={paymentState.manualAddress.complement}
                                                    onChange={e => paymentState.setManualAddress(prev => ({ ...prev, complement: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Bairro</Label>
                                                <Input
                                                    className="h-9"
                                                    value={paymentState.manualAddress.neighborhood}
                                                    onChange={e => paymentState.setManualAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Cidade/UF</Label>
                                                <div className="flex gap-1">
                                                    <Input
                                                        className="h-9 flex-1"
                                                        value={paymentState.manualAddress.city}
                                                        onChange={e => paymentState.setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                                                    />
                                                    <Input
                                                        className="h-9 w-12 text-center p-1"
                                                        value={paymentState.manualAddress.state}
                                                        maxLength={2}
                                                        onChange={e => paymentState.setManualAddress(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

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


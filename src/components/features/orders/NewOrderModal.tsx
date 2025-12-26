import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HourSelector } from "@/components/ui/hour-selector";
import { Bike, CalendarClock, CreditCard, Loader2, Plus, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import { applyCurrencyMask } from "@/lib/masks";

import { ClientSearch } from "@/components/features/pdv/payment/ClientSearch";
import { NewOrderProductSearch } from "./NewOrderProductSearch";
import { PartialPaymentBuilder, PaymentEntry } from "@/components/features/partial-payment/PartialPaymentBuilder";
import { useNewOrder, NewOrderItem } from "@/hooks/useNewOrder";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { ClientAddressDialog } from "@/components/features/clients/ClientAddressDialog";
import { ClientAddress } from "@/types/entities";
import { useQuery } from "@tanstack/react-query";
import { getPixKeys } from "@/services/database/pix_keys";
import { ProductItemSelectionDialog } from "@/components/features/pdv/ProductItemSelectionDialog";

interface NewOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderState: ReturnType<typeof useNewOrder>;
}

export function NewOrderModal({ open, onOpenChange, orderState }: NewOrderModalProps) {
    const {
        items,
        updateItemQuantity,
        removeItem,
        selectedClient,
        setSelectedClient,
        scheduledPickup,
        setScheduledPickup,
        notes,
        setNotes,
        isDelivery,
        setIsDelivery,
        deliveryAddressId,
        setDeliveryAddressId,
        deliveryFee,
        setDeliveryFee,
        hasPartialPayment,
        setHasPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,
        subtotal,
        total,
        isSubmitting,
        canSubmit,
        submit,
        close,

        // Selection dialog
        selectionOpen,
        setSelectionOpen,
        selectedProductForSelection,
        handleProductSelect,
        handleAddInternalItem,

        // Imported fields tracking
        importedFields
    } = orderState;

    const { addresses } = useClientAddresses(selectedClient?.id);
    const [showAddressDialog, setShowAddressDialog] = useState(false);
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(scheduledPickup || undefined);
    const [selectedTime, setSelectedTime] = useState<string>(
        scheduledPickup ? format(scheduledPickup, "HH:mm") : "12:00"
    );

    // Sync date/time when scheduledPickup changes (e.g., from WhatsApp import)
    useEffect(() => {
        if (scheduledPickup) {
            const currentTimeStr = format(scheduledPickup, "HH:mm");
            if (!selectedDate || selectedDate.getTime() !== scheduledPickup.getTime()) {
                setSelectedDate(scheduledPickup);
            }
            if (selectedTime !== currentTimeStr) {
                setSelectedTime(currentTimeStr);
            }
        }
    }, [scheduledPickup, selectedDate, selectedTime]);

    const { data: pixKeys = [] } = useQuery({
        queryKey: ["pixKeys", "active"],
        queryFn: async () => {
            const { data, error } = await getPixKeys({ activeOnly: true });
            if (error) throw error;
            return data || [];
        },
        enabled: open && hasPartialPayment,
    });

    useEffect(() => {
        if (isDelivery && addresses.length > 0 && !deliveryAddressId) {
            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
            setDeliveryAddressId(defaultAddr.id);
        }
    }, [isDelivery, addresses, deliveryAddressId, setDeliveryAddressId]);

    useEffect(() => {
        if (selectedDate && selectedTime) {
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours, minutes, 0, 0);

            if (!scheduledPickup || scheduledPickup.getTime() !== newDate.getTime()) {
                setScheduledPickup(newDate);
            }
        }
    }, [selectedDate, selectedTime, scheduledPickup, setScheduledPickup]);

    const handleClose = () => {
        close();
        onOpenChange(false);
    };

    const handleSubmit = async () => {
        await submit();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
                <DialogContent className="max-w-2xl w-full h-[90vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b border-border bg-muted/40 shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-xl font-playfair text-foreground">
                            <ShoppingBag className="h-5 w-5 text-primary" />
                            <span>{orderState.isEditing ? `Editar Pedido #${orderState.existingDisplayId}` : "Novo Pedido"}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                        <div className="space-y-6">
                            <ClientSearch
                                selectedClient={selectedClient}
                                onSelectClient={setSelectedClient}
                            />

                            <div>
                                <NewOrderProductSearch
                                    items={items}
                                    onProductSelect={handleProductSelect}
                                    onUpdateQuantity={updateItemQuantity}
                                    onRemoveItem={removeItem}
                                    importedFromWhatsApp={importedFields?.items}
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-primary" />
                                    Data e Hora de {isDelivery ? "Entrega" : "Retirada"} *
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal h-12",
                                                    !selectedDate && "text-muted-foreground"
                                                )}
                                            >
                                                {selectedDate ? (
                                                    format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                                                ) : (
                                                    "Selecione a data"
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    setDatePickerOpen(false);
                                                }}
                                                locale={ptBR}
                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <div className={cn(
                                        "relative transition-all duration-500 rounded-lg",
                                        importedFields?.scheduledPickup && "bg-green-50/50 dark:bg-green-900/20 ring-1 ring-green-200/50 dark:ring-green-800/50"
                                    )}>
                                        <HourSelector
                                            value={selectedTime}
                                            onChange={setSelectedTime}
                                            className={cn(
                                                "h-12",
                                                importedFields?.scheduledPickup && "border-transparent bg-transparent"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card p-4 rounded-xl border border-border space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="is-delivery-new"
                                        checked={isDelivery}
                                        onCheckedChange={(checked) => setIsDelivery(checked as boolean)}
                                    />
                                    <Label
                                        htmlFor="is-delivery-new"
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
                                                        <SelectTrigger className="flex-1 h-10">
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
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        className="h-10 w-10"
                                                        onClick={() => setShowAddressDialog(true)}
                                                    >
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
                                                                value={orderState.manualAddress.zipCode}
                                                                onChange={(e) => {
                                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                                                                    const formatted = val.replace(/^(\d{5})(\d)/, "$1-$2");
                                                                    orderState.setManualAddress(prev => ({ ...prev, zipCode: formatted }));

                                                                    if (val.length === 8) {
                                                                        fetch(`https://viacep.com.br/ws/${val}/json/`)
                                                                            .then(res => res.json())
                                                                            .then(data => {
                                                                                if (!data.erro) {
                                                                                    orderState.setManualAddress(prev => ({
                                                                                        ...prev,
                                                                                        street: data.logradouro,
                                                                                        neighborhood: data.bairro,
                                                                                        city: data.localidade,
                                                                                        state: data.uf,
                                                                                        complement: prev.complement || data.complemento
                                                                                    }));
                                                                                    // Focus number field?
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
                                                            value={orderState.manualAddress.street}
                                                            onChange={e => orderState.setManualAddress(prev => ({ ...prev, street: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-[80px_1fr] gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Número</Label>
                                                        <Input
                                                            className="h-9"
                                                            placeholder="123"
                                                            value={orderState.manualAddress.number}
                                                            onChange={e => orderState.setManualAddress(prev => ({ ...prev, number: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Complemento</Label>
                                                        <Input
                                                            className="h-9"
                                                            placeholder="Apto 101..."
                                                            value={orderState.manualAddress.complement}
                                                            onChange={e => orderState.setManualAddress(prev => ({ ...prev, complement: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Bairro</Label>
                                                        <Input
                                                            className="h-9"
                                                            value={orderState.manualAddress.neighborhood}
                                                            onChange={e => orderState.setManualAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Cidade/UF</Label>
                                                        <div className="flex gap-1">
                                                            <Input
                                                                className="h-9 flex-1"
                                                                value={orderState.manualAddress.city}
                                                                onChange={e => orderState.setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                                                            />
                                                            <Input
                                                                className="h-9 w-12 text-center p-1"
                                                                value={orderState.manualAddress.state}
                                                                maxLength={2}
                                                                onChange={e => orderState.setManualAddress(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
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
                                                className="h-10"
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

                            <div className="space-y-2">
                                <Label>
                                    Observações
                                </Label>
                                <div className={cn(
                                    "relative transition-all duration-500 rounded-lg",
                                    importedFields?.notes && "bg-green-50/50 dark:bg-green-900/20 ring-1 ring-green-200/50 dark:ring-green-800/50"
                                )}>
                                    <Textarea
                                        placeholder="Observações do pedido..."
                                        className={cn(
                                            "resize-none min-h-[80px]",
                                            importedFields?.notes && "border-transparent bg-transparent focus-visible:ring-offset-0"
                                        )}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={cn(
                                "bg-card p-4 rounded-xl border border-border space-y-4 transition-all duration-500",
                                importedFields?.paymentMethod && "bg-green-50/50 dark:bg-green-900/20 ring-1 ring-green-200/50 dark:ring-green-800/50 border-transparent"
                            )}>
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2 text-sm font-medium">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        Sinal / Pagamento Parcial
                                    </Label>
                                    <Switch
                                        checked={hasPartialPayment}
                                        onCheckedChange={setHasPartialPayment}
                                    />
                                </div>

                                {hasPartialPayment && (
                                    <div className="animate-in slide-in-from-top-2">
                                        <PartialPaymentBuilder
                                            totalAmount={total}
                                            paymentEntries={paymentEntries}
                                            onAddEntry={addPaymentEntry}
                                            onRemoveEntry={removePaymentEntry}
                                            pixKeys={pixKeys}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border bg-muted/40 space-y-4 shrink-0">
                        <div className="flex flex-col gap-1">
                            {isDelivery && deliveryFee > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                            )}
                            {isDelivery && deliveryFee > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Taxa de Entrega</span>
                                    <span>{formatCurrency(deliveryFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 text-lg shadow-lg font-bold"
                            disabled={!canSubmit || isSubmitting}
                            onClick={handleSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                    {orderState.isEditing ? "Salvar Alterações" : "Criar Pedido"}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ClientAddressDialog
                open={showAddressDialog}
                onOpenChange={setShowAddressDialog}
                clientId={selectedClient?.id || ""}
            />

            <ProductItemSelectionDialog
                open={selectionOpen}
                onOpenChange={setSelectionOpen}
                product={selectedProductForSelection}
                onSelect={handleAddInternalItem}
                // Determine excluded items (optional, if we want to prevent re-selecting same item ID)
                excludedItemIds={items.map(i => i.productItemId).filter(Boolean) as string[]}
            />
        </>
    );
}

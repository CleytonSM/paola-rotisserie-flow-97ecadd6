import React from "react";
import { CatalogLayout } from "@/components/layout/CatalogLayout";
import { useCatalogStore } from "@/stores/useCatalogStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MessageCircle, Clock, ShoppingBag, Banknote, CreditCard, Wallet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { HourSelector } from "@/components/ui/hour-selector";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatPhone, applyCepMask } from "@/lib/masks";
import { Search, Loader2 } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { PaymentMethodCard } from "@/components/features/pdv/PaymentMethodCard";
import { upsertClientByPhone } from "@/services/database/clients";
import { upsertClientAddressByCep } from "@/services/database/addresses";
import { useStoreHours } from "@/hooks/useStoreHours";
import { isStoreOpenNow, getNextStoreOpeningDate } from "@/lib/storeHours";
import { AlertCircle } from "lucide-react";

const PixIcon = ({ className }: { className?: string }) => (
    <img
        src="/pix.svg"
        alt="Pix"
        className={cn("h-6 w-6 object-contain", className)}
    />
);

export function CheckoutPage() {
    const { items, total, itemCount, clearCart, clientDetails, updateClientDetails, setLastOrderedProductIds } = useCatalogStore();
    const { settings } = useAppSettings();
    const { hours, isLoading: isLoadingHours } = useStoreHours();
    const navigate = useNavigate();

    const [clientName, setClientName] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    const [time, setTime] = React.useState("12:00");
    const [notes, setNotes] = React.useState("");
    const [isDelivery, setIsDelivery] = React.useState(false);
    const [isTimeManuallySet, setIsTimeManuallySet] = React.useState(false);
    const [paymentMethod, setPaymentMethod] = React.useState<string | null>(null);

    // Detailed address state
    const [cep, setCep] = React.useState("");
    const [street, setStreet] = React.useState("");
    const [number, setNumber] = React.useState("");
    const [complement, setComplement] = React.useState("");
    const [neighborhood, setNeighborhood] = React.useState("");
    const [city, setCity] = React.useState("");
    const [state, setState] = React.useState("");
    const [isLoadingCep, setIsLoadingCep] = React.useState(false);

    // Initial pre-fill from store
    React.useEffect(() => {
        if (clientDetails) {
            setClientName(clientDetails.name || "");
            setPhone(clientDetails.phone || "");
            setCep(clientDetails.cep || "");
            setStreet(clientDetails.street || "");
            setNumber(clientDetails.number || "");
            setComplement(clientDetails.complement || "");
            setNeighborhood(clientDetails.neighborhood || "");
            setCity(clientDetails.city || "");
            setState(clientDetails.state || "");
            if (clientDetails.cep) setIsDelivery(true);
        }
    }, [clientDetails]);

    React.useEffect(() => {
        if (items.length === 0) {
            navigate("/cardapio");
        }
    }, [items, navigate]);

    // Initialize with next opening if store is closed
    React.useEffect(() => {
        if (hours && hours.length > 0) {
            const status = isStoreOpenNow(hours);
            if (!status.isOpen) {
                const next = getNextStoreOpeningDate(hours);
                setDate(next.date);
                setTime(next.time);
            }
        }
    }, [hours]);

    // Auto-adjust delivery time for orders scheduled for today
    React.useEffect(() => {
        if (isDelivery && date && !isTimeManuallySet && hours) {
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                const now = new Date();
                const marginTime = new Date(now.getTime() + 30 * 60000);
                let hrs = marginTime.getHours();
                let mins = marginTime.getMinutes();

                // Round up to nearest multiple of 5 (e.g., 12:02 -> 12:05)
                const roundedMinutes = Math.ceil(mins / 5) * 5;
                if (roundedMinutes >= 60) {
                    hrs = (hrs + 1) % 24;
                    mins = 0;
                } else {
                    mins = roundedMinutes;
                }

                // Check store hours for today
                const jsDay = now.getDay();
                const dbDay = jsDay === 0 ? 7 : jsDay;
                const todayStoreHours = hours.find(h => h.day_of_week === dbDay);

                if (todayStoreHours?.is_open) {
                    const storeOpen = todayStoreHours.open_time.substring(0, 5);
                    const currentTime = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

                    if (currentTime < storeOpen) {
                        setTime(storeOpen);
                    } else {
                        setTime(currentTime);
                    }
                }
            }
        }
    }, [isDelivery, date, isTimeManuallySet, hours]);

    const handleCepSearch = async (cepValue: string) => {
        const cleanCep = cepValue.replace(/\D/g, "");
        if (cleanCep.length !== 8) return;

        try {
            setIsLoadingCep(true);
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error("CEP não encontrado");
                return;
            }

            setStreet(data.logradouro || "");
            setNeighborhood(data.bairro || "");
            setCity(data.localidade || "");
            setState(data.uf || "");
            toast.success("Endereço preenchido!");
        } catch (error) {
            toast.error("Erro ao buscar CEP");
        } finally {
            setIsLoadingCep(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!clientName || !phone) {
            toast.error("Por favor, preencha nome e telefone.");
            return;
        }

        if (isDelivery && (!cep || !street || !number || !neighborhood || !city)) {
            toast.error("Por favor, preencha o endereço completo para entrega.");
            return;
        }

        if (!paymentMethod) {
            toast.error("Por favor, selecione uma forma de pagamento.");
            return;
        }

        // Validate store hours
        if (hours && date) {
            const jsDay = date.getDay();
            const dbDay = jsDay === 0 ? 7 : jsDay;
            const dayStoreHours = hours.find(h => h.day_of_week === dbDay);

            if (!dayStoreHours || !dayStoreHours.is_open) {
                toast.error("A loja não abre no dia selecionado.");
                return;
            }

            const selectedTimeStr = `${time}:00`;
            if (selectedTimeStr < dayStoreHours.open_time || selectedTimeStr > dayStoreHours.close_time) {
                toast.error(`Para este dia, selecione um horário entre ${dayStoreHours.open_time.substring(0, 5)} e ${dayStoreHours.close_time.substring(0, 5)}.`);
                return;
            }
        }

        try {
            // 1. Create or update client automatically
            const { data: client, error: clientError } = await upsertClientByPhone({
                name: clientName,
                phone: phone
            });

            if (clientError) {
                console.error("Error upserting client:", clientError);
            } else if (client && isDelivery) {
                // 2. Create or update address if it's delivery
                const { error: addressError } = await upsertClientAddressByCep({
                    client_id: client.id,
                    street,
                    number,
                    complement,
                    neighborhood,
                    city,
                    state,
                    zip_code: cep.replace(/\D/g, ""),
                    is_default: true
                });

                if (addressError) {
                    console.error("Error upserting address:", addressError);
                }
            }
        } catch (err) {
            console.error("Failed to sync client/address:", err);
        }

        const dateStr = date ? format(date, "dd/MM/yyyy") : "A combinar";
        const itemsList = items
            .map((item) => `${item.quantity}x ${item.name} - ${formatCurrency(item.base_price * item.quantity)}`)
            .join("\n");

        const fullAddress = isDelivery
            ? `${street}, ${number}${complement ? ` (${complement})` : ""} - ${neighborhood}, ${city}/${state} - CEP: ${cep}`
            : "";

        const deliveryFee = settings?.fixed_delivery_fee || 0;
        const currentTotal = total() + (isDelivery ? deliveryFee : 0);

        const paymentMethodLabel = {
            pix: "Pix",
            cash: "Dinheiro",
            card_credit: "Cartão de Crédito",
            card_debit: "Cartão de Débito",
        }[paymentMethod as string] || paymentMethod;

        const message = `*${settings?.store_name || "Paola Gonçalves Rotisseria"}*
Novo pedido online

*Cliente:* ${clientName}
*Telefone:* ${phone}
*Modalidade:* ${isDelivery ? "Entrega" : "Retirada"}
${isDelivery ? `*Endereço:* ${fullAddress}\n` : ""}*Data:* ${dateStr} às ${time}
*Pagamento:* ${paymentMethodLabel}

*Itens:*
${itemsList}

${isDelivery ? `*Subtotal:* ${formatCurrency(total())}\n*Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n` : ""}*Total:* ${formatCurrency(currentTotal)}

${notes ? `*Observações:* ${notes}` : ""}

Pedido enviado via Catálogo Virtual`;

        const encodedMessage = encodeURIComponent(message);
        const storePhone = settings?.store_whatsapp?.replace(/\D/g, "") || "5511999999999";
        window.open(`https://wa.me/${storePhone}?text=${encodedMessage}`, "_blank");

        // Save details for next time
        updateClientDetails({
            name: clientName,
            phone,
            cep: isDelivery ? cep : undefined,
            street: isDelivery ? street : undefined,
            number: isDelivery ? number : undefined,
            complement: isDelivery ? complement : undefined,
            neighborhood: isDelivery ? neighborhood : undefined,
            city: isDelivery ? city : undefined,
            state: isDelivery ? state : undefined,
        });

        // Save last ordered product IDs
        setLastOrderedProductIds(items.map(i => i.id));

        toast.success("Pedido enviado para o WhatsApp!");
        clearCart();
        navigate("/cardapio");
    };

    const handleClearData = () => {
        updateClientDetails(null);
        setClientName("");
        setPhone("");
        setCep("");
        setStreet("");
        setNumber("");
        setComplement("");
        setNeighborhood("");
        setCity("");
        setIsDelivery(false);
        toast.success("Dados salvos limpos!");
    };

    return (
        <CatalogLayout>
            <div className="container py-12 md:py-20">
                <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-12">
                    {/* Form Section */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-display font-bold mb-2">Finalizar Pedido</h2>
                                <p className="text-muted-foreground">Preencha seus dados para completarmos o pedido via WhatsApp.</p>
                            </div>
                            {clientDetails && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearData}
                                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    Limpar dados salvos
                                </Button>
                            )}
                        </div>

                        {hours && !isStoreOpenNow(hours).isOpen && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-900">Loja Fechada Agora</p>
                                    <p className="text-sm text-amber-700 leading-relaxed">
                                        Estamos fora do horário de atendimento. Seu pedido será agendado para o próximo horário disponível:
                                        <span className="font-bold underline ml-1">
                                            {format(getNextStoreOpeningDate(hours).date, "dd/MM")} às {getNextStoreOpeningDate(hours).time}
                                        </span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                                <Input
                                    id="name"
                                    placeholder="Como podemos te chamar?"
                                    className="h-12 bg-card border-primary/10"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Telefone / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    placeholder="(11) 99999-9999"
                                    className="h-12 bg-card border-primary/10"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    maxLength={15}
                                    autoComplete="tel"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Data da {isDelivery ? 'Entrega' : 'Retirada'}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-12 justify-start text-left font-normal bg-card border-primary/10",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                                                {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                locale={ptBR}
                                                disabled={(d) => {
                                                    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                                                    if (!hours) return false;
                                                    const jsDay = d.getDay();
                                                    const dbDay = jsDay === 0 ? 7 : jsDay;
                                                    const dayHours = hours.find(h => h.day_of_week === dbDay);
                                                    if (!dayHours || !dayHours.is_open) return true;

                                                    // If it's today and already passed closing time
                                                    const now = new Date();
                                                    if (d.toDateString() === now.toDateString()) {
                                                        const currentTimeStr = format(now, "HH:mm:ss");
                                                        if (currentTimeStr > dayHours.close_time) return true;
                                                    }

                                                    return false;
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Horário Aproximado</Label>
                                    <HourSelector
                                        value={time}
                                        onChange={(newTime) => {
                                            setTime(newTime);
                                            setIsTimeManuallySet(true);
                                        }}
                                        className="h-12 bg-card border-primary/10"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 bg-primary/5 p-4 rounded-lg border border-primary/10 transition-colors hover:bg-primary/10">
                                <Checkbox
                                    id="delivery"
                                    checked={isDelivery}
                                    onCheckedChange={(checked) => setIsDelivery(checked as boolean)}
                                    className="h-5 w-5 border-primary"
                                />
                                <Label htmlFor="delivery" className="font-bold text-primary cursor-pointer">Solicitar entrega a domicílio</Label>
                            </div>

                            {isDelivery && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-1 grid gap-2">
                                            <Label htmlFor="cep" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">CEP</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="cep"
                                                    placeholder="00000-000"
                                                    className="h-12 bg-card border-primary/10"
                                                    value={cep}
                                                    onChange={(e) => {
                                                        const value = applyCepMask(e.target.value);
                                                        setCep(value);
                                                        if (value.replace(/\D/g, "").length === 8) {
                                                            handleCepSearch(value);
                                                        }
                                                    }}
                                                    maxLength={9}
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-12 w-12 border-primary/10 shrink-0"
                                                    onClick={() => handleCepSearch(cep)}
                                                    disabled={isLoadingCep}
                                                >
                                                    {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-primary" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 grid gap-2">
                                            <Label htmlFor="city" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label>
                                            <Input
                                                id="city"
                                                placeholder="Ex: São Paulo"
                                                className="h-12 bg-card border-primary/10"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3 grid gap-2">
                                            <Label htmlFor="street" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rua / Logradouro</Label>
                                            <Input
                                                id="street"
                                                placeholder="Ex: Rua das Flores"
                                                className="h-12 bg-card border-primary/10"
                                                value={street}
                                                onChange={(e) => setStreet(e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-1 grid gap-2">
                                            <Label htmlFor="number" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Número</Label>
                                            <Input
                                                id="number"
                                                placeholder="Ex: 123"
                                                className="h-12 bg-card border-primary/10"
                                                value={number}
                                                onChange={(e) => setNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="neighborhood" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Bairro</Label>
                                            <Input
                                                id="neighborhood"
                                                placeholder="Ex: Centro"
                                                className="h-12 bg-card border-primary/10"
                                                value={neighborhood}
                                                onChange={(e) => setNeighborhood(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="complement" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Complemento (Opcional)</Label>
                                            <Input
                                                id="complement"
                                                placeholder="Ex: Ap 42, Bloco B"
                                                className="h-12 bg-card border-primary/10"
                                                value={complement}
                                                onChange={(e) => setComplement(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Observações (Opcional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Ex: Ponto de referência, tirar cebola, etc."
                                    className="bg-card border-primary/10 min-h-[100px]"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-primary/10">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Forma de Pagamento</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <PaymentMethodCard
                                        id="pix"
                                        title="Pix"
                                        icon={PixIcon}
                                        selected={paymentMethod === "pix"}
                                        onClick={() => setPaymentMethod("pix")}
                                    />
                                    <PaymentMethodCard
                                        id="cash"
                                        title="Dinheiro"
                                        icon={Banknote}
                                        selected={paymentMethod === "cash"}
                                        onClick={() => setPaymentMethod("cash")}
                                    />
                                    <PaymentMethodCard
                                        id="card_credit"
                                        title="Cartão de Crédito"
                                        icon={CreditCard}
                                        selected={paymentMethod === "card_credit"}
                                        onClick={() => setPaymentMethod("card_credit")}
                                    />
                                    <PaymentMethodCard
                                        id="card_debit"
                                        title="Cartão de Débito"
                                        icon={CreditCard}
                                        selected={paymentMethod === "card_debit"}
                                        onClick={() => setPaymentMethod("card_debit")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="w-full lg:w-[350px]">
                        <Card className="sticky top-32 border-primary/10 shadow-xl shadow-primary/5 bg-card overflow-hidden">
                            <CardHeader className="bg-muted/50 border-b border-border/50">
                                <CardTitle className="text-lg font-display flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-primary" />
                                    Resumo do Pedido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                <span className="font-bold text-foreground">{item.quantity}x</span> {item.name}
                                            </span>
                                            <span className="font-medium">{formatCurrency(item.base_price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-dashed border-border pt-4 mt-4 space-y-2">
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(total())}</span>
                                    </div>
                                    {isDelivery && (
                                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                                            <span>Taxa de Entrega</span>
                                            <span>{formatCurrency(settings?.fixed_delivery_fee || 0)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-lg">Total estimado</span>
                                        <span className="text-2xl font-bold text-primary">
                                            {formatCurrency(total() + (isDelivery ? (settings?.fixed_delivery_fee || 0) : 0))}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wider mt-4">
                                        O pagamento é feito diretamente no WhatsApp ou na retirada/entrega.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0">
                                <Button
                                    className="w-full h-14 gap-2 text-lg font-bold  bg-green-600 hover:bg-green-700 text-white active:scale-95 transition-all"
                                    onClick={handleSendWhatsApp}
                                >
                                    <MessageCircle className="h-6 w-6" />
                                    Enviar via WhatsApp
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </CatalogLayout>
    );
}

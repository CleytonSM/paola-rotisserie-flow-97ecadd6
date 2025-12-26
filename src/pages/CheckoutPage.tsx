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

    // Auto-adjust delivery time for orders scheduled for today
    React.useEffect(() => {
        if (isDelivery && date && !isTimeManuallySet) {
            const today = new Date();
            if (date.toDateString() === today.toDateString()) {
                const now = new Date();
                const marginTime = new Date(now.getTime() + 30 * 60000);
                let hours = marginTime.getHours();
                let minutes = marginTime.getMinutes();

                // Round up to nearest multiple of 5 (e.g., 12:02 -> 12:05)
                const roundedMinutes = Math.ceil(minutes / 5) * 5;
                if (roundedMinutes >= 60) {
                    hours = (hours + 1) % 24;
                    minutes = 0;
                } else {
                    minutes = roundedMinutes;
                }

                const hoursStr = hours.toString().padStart(2, '0');
                const minutesStr = minutes.toString().padStart(2, '0');
                setTime(`${hoursStr}:${minutesStr}`);
            }
        }
    }, [isDelivery, date, isTimeManuallySet]);

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
            ? `${street}, ${number}${complement ? ` (${complement})` : ""} - ${neighborhood}, ${city} - CEP: ${cep}`
            : "";

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

*Total:* ${formatCurrency(total())}

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
                                <div className="border-t border-dashed border-border pt-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-lg">Total estimado</span>
                                        <span className="text-2xl font-bold text-primary">{formatCurrency(total())}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-wider mt-4">
                                        O pagamento é feito diretamente no WhatsApp ou na retirada/entrega.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0">
                                <Button
                                    className="w-full h-14 gap-2 text-lg font-bold shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-white active:scale-95 transition-all"
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

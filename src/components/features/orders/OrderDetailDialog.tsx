import { useRef, useState } from "react";
import { Order, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, checkAndSetOrderReady, linkProductItemToSaleItem } from "@/services/database/orders";
import { addPaymentToOrder, deleteOrder } from "@/services/database/sales";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Package, CreditCard, Calendar, FileText, X, ChevronRight, ScanBarcode, Truck, MapPin, Printer, ExternalLink, Pencil, Trash2, Plus, QrCode } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentIcon } from 'react-svg-credit-card-payment-icons';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QRCodeModal } from "@/components/features/pdv/QRCodeModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OrderItemLinkingFlow } from "./OrderItemLinkingFlow";
import { ProductCatalog } from "@/services/database/product-catalog";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PartialPaymentBuilder, PaymentEntry } from "@/components/features/partial-payment/PartialPaymentBuilder";
import { getPixKeys } from "@/services/database/pix_keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNewOrder } from "@/hooks/useNewOrder";
import { NewOrderModal } from "./NewOrderModal";
import { buildWhatsAppClientReplyUrl, getWhatsAppReplyParamsFromOrder } from "@/utils/whatsappClientReply";

interface OrderDetailDialogProps {
    order: Order | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
    isUpdating?: boolean;
}

export function OrderDetailDialog({
    order,
    open,
    onOpenChange,
    onStatusChange,
    isUpdating
}: OrderDetailDialogProps) {
    const [selectedItem, setSelectedItem] = useState<{
        saleItemId: string;
        product: ProductCatalog;
    } | null>(null);

    const { settings } = useAppSettings();

    // Logic for Edit, Delete and Add Payment
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Edit Order Logic
    const editOrderState = useNewOrder(() => {
        onOpenChange(false);
    });

    // Add Payment Logic
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPaymentEntries, setNewPaymentEntries] = useState<PaymentEntry[]>([]);
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [showPixModal, setShowPixModal] = useState(false);
    const [pixModalData, setPixModalData] = useState<{ key: string, amount: number } | null>(null);

    const { data: pixKeys = [] } = useQuery({
        queryKey: ["pixKeys", "active"],
        queryFn: async () => {
            const { data, error } = await getPixKeys({ activeOnly: true });
            if (error) throw error;
            return data || [];
        },
        enabled: open, // Always fetch when dialog is open
    });

    const handleAddPayment = async () => {
        if (newPaymentEntries.length === 0) return;

        setIsAddingPayment(true);
        try {
            for (const entry of newPaymentEntries) {
                const { error } = await addPaymentToOrder({
                    saleId: order.id,
                    amount: entry.amount,
                    paymentMethod: entry.method,
                    pixKeyId: entry.details?.pixKeyId,
                    machineId: entry.details?.machineId,
                    cardFlag: entry.details?.cardBrand,
                    installments: 1
                });
                if (error) throw error;
            }
            toast.success("Pagamento adicionado com sucesso!");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setShowAddPayment(false);
            setNewPaymentEntries([]);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao adicionar pagamento");
        } finally {
            setIsAddingPayment(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await deleteOrder(order.id);
            if (error) throw error;
            toast.success("Pedido excluído com sucesso");
            onOpenChange(false);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir pedido");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    if (!order) return null;

    const paidAmount = order.sale_payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const isPaid = paidAmount >= order.total_amount;
    const remainingAmount = order.total_amount - paidAmount;

    const getNextStatus = (): OrderStatus | null => {
        switch (order.order_status) {
            case 'received': return 'preparing';
            case 'preparing': return 'ready';
            case 'ready': return 'delivered';
            default: return null;
        }
    };

    const nextStatus = getNextStatus();

    const getActionButtonStyle = (status: OrderStatus) => {
        switch (status) {
            case 'preparing':
                return "bg-amber-500 hover:bg-amber-600 text-white";
            case 'ready':
                return "bg-emerald-500 hover:bg-emerald-600 text-white";
            case 'delivered':
                return "bg-primary hover:bg-primary/90 text-primary-foreground";
            default:
                return "";
        }
    };

    const formatPaymentMethod = (method: string) => {
        const methods: Record<string, string> = {
            'pix': 'Pix',
            'cash': 'Dinheiro',
            'card_credit': 'Cartão Crédito',
            'card_debit': 'Cartão Débito',
            'multiple': 'Múltiplos'
        };
        return methods[method] || method;
    };

    const handleOpenPixModal = (key: string, amount: number) => {
        setPixModalData({ key, amount });
        setShowPixModal(true);
    };

    // Format addresses
    const storeAddress = settings ?
        `${settings.store_address_street || ''}, ${settings.store_address_number || ''}${settings.store_address_complement ? ' - ' + settings.store_address_complement : ''} - ${settings.store_address_neighborhood || ''}` :
        "Endereço da loja não configurado";

    const clientAddress = order.delivery_street ?
        `${order.delivery_street}, ${order.delivery_number || 'S/N'}${order.delivery_complement ? ' - ' + order.delivery_complement : ''}, ${order.delivery_neighborhood}, ${order.delivery_city} - ${order.delivery_zip_code}` :
        (order.client_addresses ?
            `${order.client_addresses.street}, ${order.client_addresses.number}${order.client_addresses.complement ? ' - ' + order.client_addresses.complement : ''}, ${order.client_addresses.neighborhood}, ${order.client_addresses.city} - ${order.client_addresses.zip_code}` :
            "Endereço não disponível");

    const mapsUrl = order.delivery_street ?
        `https://maps.google.com/?q=${encodeURIComponent(`${order.delivery_street}, ${order.delivery_number}, ${order.delivery_city}, ${order.delivery_state}`)}` :
        (order.client_addresses ?
            `https://maps.google.com/?q=${encodeURIComponent(`${order.client_addresses.street}, ${order.client_addresses.number}, ${order.client_addresses.city}, ${order.client_addresses.state}`)}` :
            "#");

    const handleWhatsApp = () => {
        const message = `
*PEDIDO #${order.display_id}*
--------------------------------
*Retirada:* ${storeAddress} ${settings?.store_cnpj ? `\nCNPJ: ${settings.store_cnpj}` : ''}
--------------------------------
*Entrega:* ${clientAddress}
--------------------------------
*Cliente:* ${order.clients?.name || 'Cliente'} - ${order.clients?.phone || ''}
--------------------------------
*Pedido:*
${order.sale_items?.map(i => `${i.quantity}x ${i.name}`).join('\n')}
--------------------------------
*Valor Total:* ${formatCurrency(order.total_amount)}
${!isPaid && remainingAmount > 0 ? `*A Cobrar:* ${formatCurrency(remainingAmount)}` : '*PAGO*'}
${order.change_amount ? `*Troco para:* ${formatCurrency(order.change_amount)}` : ''}
${order.notes ? `\n*Obs:* ${order.notes}` : ''}
`.trim();

        const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
            <html>
                <head>
                    <title>Pedido #${order.display_id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; max-width: 300px; margin: 0 auto; }
                        h1 { font-size: 18px; text-align: center; border-bottom: 1px solid #000; padding-bottom: 10px; }
                        .section { margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
                        .label { font-size: 10px; color: #666; text-transform: uppercase; }
                        .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
                        .big-value { font-size: 16px; font-weight: bold; margin-top: 2px; }
                        .items { font-size: 12px; margin-top: 5px; }
                        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>ENTREGA - #${order.display_id}</h1>
                    
                    <div class="section">
                        <div class="label">DESTINO</div>
                        <div class="big-value">${clientAddress}</div>
                        <div style="font-size: 12px; margin-top: 5px;">${order.clients?.name} - ${order.clients?.phone}</div>
                    </div>

                    <div class="section">
                        <div class="label">ORIGEM (RETIRADA)</div>
                        <div class="value">${storeAddress}</div>
                    </div>

                    <div class="section">
                        <div class="label">OBSERVAÇÕES</div>
                        <div class="value">${order.notes || "Sem observações"}</div>
                    </div>

                    <div class="section">
                        <div class="label">PAGAMENTO</div>
                        <div class="items">
                           ${!isPaid && remainingAmount > 0 ? `A COBRAR: ${formatCurrency(remainingAmount)}` : 'PAGO'}
                           ${order.change_amount ? `<br>TROCO: ${formatCurrency(order.change_amount)}` : ''}
                        </div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Pedido #{order.display_id}
                                <Badge
                                    variant="outline"
                                    className={cn("text-xs font-normal", ORDER_STATUS_COLORS[order.order_status])}
                                >
                                    {ORDER_STATUS_LABELS[order.order_status]}
                                </Badge>

                            </DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(order.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                        </div>

                        <div className="flex gap-2 mr-12">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5"
                                onClick={() => editOrderState.editOrder(order)}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Editar
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className="p-6 space-y-6">

                        {/* Delivery Section - Cleaned up */}
                        {order.is_delivery && (
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="bg-muted/40 px-4 py-3 border-b border-border flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-muted-foreground" />
                                        <h3 className="font-semibold text-sm">Entrega</h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-primary"
                                        asChild
                                    >
                                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                                            <MapPin className="w-3.5 h-3.5" />
                                            Abrir Mapa
                                        </a>
                                    </Button>
                                </div>
                                <div className="p-4 space-y-5 bg-card">

                                    {/* Timeline-ish Address View */}
                                    <div className="relative pl-2">
                                        {/* Connecting Line */}
                                        <div className="absolute left-[7px] top-3 bottom-6 w-0.5 bg-border/50" />

                                        {/* Store Address */}
                                        <div className="relative pl-8 mb-6">
                                            {/* Store Dot Animation */}
                                            <div
                                                style={{ animationDuration: '1.5s' }}
                                                className={cn(
                                                    "absolute left-[-8px] top-1 w-4 h-4 rounded-full border-2 ring-4 ring-background transition-all duration-500 z-10",
                                                    "border-muted bg-background",

                                                    // Received: Blue pulse (or red if late)
                                                    order.order_status === 'received' && "border-blue-600 bg-blue-50 shadow-[0_0_10px_rgba(37,99,235,0.3)] animate-pulse",

                                                    // Preparing: Amber pulse
                                                    order.order_status === 'preparing' && "border-amber-500 bg-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse",

                                                    // Ready/Delivered: Solid Green
                                                    (order.order_status === 'ready' || order.order_status === 'delivered') && "border-emerald-500 bg-emerald-500 shadow-none scale-100"
                                                )} />

                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Retirada</p>
                                            <p className="text-sm font-medium">{settings?.store_address_street || "Loja"}, {settings?.store_address_number || "S/N"}</p>

                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                {settings?.store_address_neighborhood && <span>{settings.store_address_neighborhood}</span>}
                                                {settings?.store_address_city && <span>• {settings.store_address_city}</span>}
                                                {settings?.store_address_zip_code && <span>• CEP {settings.store_address_zip_code}</span>}
                                            </div>
                                        </div>

                                        {/* Client Address */}
                                        <div className="relative pl-8">
                                            {/* Client Dot Animation */}
                                            <div
                                                style={{ animationDuration: '1.5s' }}
                                                className={cn(
                                                    "absolute left-[-8px] top-1 w-4 h-4 rounded-full border-2 ring-4 ring-background transition-all duration-500 z-10",
                                                    "border-muted bg-background",

                                                    // Ready: Destination waiting (Yellow pulse)
                                                    order.order_status === 'ready' && "border-amber-500 bg-amber-50 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]",

                                                    // Delivered: Solid Green
                                                    order.order_status === 'delivered' && "border-emerald-500 bg-emerald-500 shadow-none scale-100"
                                                )} />

                                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Entrega</p>
                                            <p className="text-sm font-medium">
                                                {order.delivery_street
                                                    ? `${order.delivery_street}, ${order.delivery_number || 'S/N'}${order.delivery_complement ? ' - ' + order.delivery_complement : ''}`
                                                    : (order.client_addresses
                                                        ? `${order.client_addresses.street}, ${order.client_addresses.number}${order.client_addresses.complement ? ' - ' + order.client_addresses.complement : ''}`
                                                        : "Endereço não disponível")
                                                }
                                            </p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                                                {order.delivery_street ? (
                                                    <>
                                                        <span>{order.delivery_neighborhood}</span>
                                                        {order.delivery_city && <span>• {order.delivery_city}</span>}
                                                        {order.delivery_zip_code && <span>• CEP {order.delivery_zip_code}</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{order.client_addresses?.neighborhood}</span>
                                                        {order.client_addresses?.city && <span>• {order.client_addresses.city}</span>}
                                                        {order.client_addresses?.zip_code && <span>• CEP {order.client_addresses.zip_code}</span>}
                                                    </>
                                                )}
                                            </div>

                                            {/* Client Info inline */}
                                            <div className="mt-3 flex items-center gap-2 text-sm bg-muted/30 p-2 rounded border border-muted/50 w-fit">
                                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="font-medium">{order.clients?.name || "Cliente"}</span>
                                                {order.clients?.phone && (
                                                    <>
                                                        <span className="text-muted-foreground/30">|</span>
                                                        <span className="text-muted-foreground">{order.clients.phone}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            onClick={handleWhatsApp}
                                            size="sm"
                                            className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-sm h-8 flex-1"
                                        >
                                            <WhatsAppIcon className="w-3.5 h-3.5 mr-2" />
                                            Enviar p/ Motoboy
                                        </Button>
                                        <Button
                                            onClick={handlePrint}
                                            size="sm"
                                            variant="outline"
                                            className="h-8 flex-1"
                                        >
                                            <Printer className="w-3.5 h-3.5 mr-2" />
                                            Imprimir Etiqueta
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cliente - Only show if NOT delivery (since it's already shown in delivery section) OR keep consistent? 
                            User said "Nova seção Entrega bem destacada". Didn't say to remove "Cliente" section, but it's redundant.
                            Let's keep it for consistency for now, or hide if delivery?
                            Actually, standard details are good to keep. 
                        */}
                        {!order.is_delivery && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <p className="font-medium">{order.clients?.name || "Consumidor Final"}</p>
                                    {order.clients?.phone && (
                                        <p className="text-sm text-muted-foreground">{order.clients.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Retirada */}
                        {order.scheduled_pickup && (
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {order.is_delivery ? "Entrega Agendada" : "Retirada Agendada"}
                                    </p>
                                    <p className="font-medium">
                                        {format(new Date(order.scheduled_pickup), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Itens */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Itens do Pedido</h3>
                            </div>
                            <div className="space-y-2">
                                {order.sale_items?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.quantity}x {formatCurrency(item.unit_price)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold">{formatCurrency(item.total_price)}</p>

                                            {/* Link Item Button for internal items without product_item_id */}
                                            {!item.product_item_id && item.product_catalog?.is_internal && order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 gap-1 text-xs border-dashed border-primary/50 hover:bg-primary/5 hover:border-primary text-primary"
                                                    onClick={() => {
                                                        if (item.product_catalog) {
                                                            setSelectedItem({
                                                                saleItemId: item.id,
                                                                product: item.product_catalog as any
                                                            });
                                                        } else {
                                                            toast.error("Produto não encontrado no catálogo.");
                                                        }
                                                    }}
                                                >
                                                    <ScanBarcode className="w-3 h-3" />
                                                    Vincular
                                                </Button>
                                            )}
                                            {item.product_item_id && item.product_catalog?.is_internal && (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Vinculado
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />


                        {/* Pagamento */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-semibold">Pagamento</h3>
                            </div>
                            <div className="space-y-2">
                                {order.sale_payments?.map((payment, index) => (
                                    <div key={index} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/30">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{formatPaymentMethod(payment.payment_method)}</p>
                                            {payment.card_flag && (
                                                <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-border/40">
                                                    <PaymentIcon
                                                        type={(() => {
                                                            const low = payment.card_flag.toLowerCase().trim();
                                                            if (low.includes('visa')) return 'Visa';
                                                            if (low.includes('master')) return 'Mastercard';
                                                            if (low.includes('elo')) return 'Elo';
                                                            if (low.includes('amex') || low.includes('american')) return 'AmericanExpress';
                                                            if (low.includes('hipercard')) return 'Hipercard';
                                                            if (low.includes('hiper')) return 'Hiper';
                                                            if (low.includes('diners')) return 'DinersClub';
                                                            if (low.includes('discover')) return 'Discover';
                                                            return 'Generic';
                                                        })()}
                                                        format="flatRounded"
                                                        width={20}
                                                    />
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                                        {payment.card_flag}
                                                    </span>
                                                </div>
                                            )}
                                            {payment.payment_method === 'pix' && (payment.pix_keys?.key_value || pixKeys[0]?.key_value) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                                    onClick={() => handleOpenPixModal(payment.pix_keys?.key_value || pixKeys[0]?.key_value, payment.amount)}
                                                >
                                                    <QrCode className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</p>
                                    </div>
                                ))}
                            </div>

                            {!isPaid && remainingAmount > 0 && (
                                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm text-amber-800">Restante a pagar</p>
                                        <p className="font-bold text-amber-800">{formatCurrency(remainingAmount)}</p>
                                    </div>

                                    {!showAddPayment ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full bg-white border-amber-200 text-amber-900 hover:bg-amber-100"
                                            onClick={() => setShowAddPayment(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Adicionar Pagamento
                                        </Button>
                                    ) : (
                                        <div className="bg-white p-3 rounded border border-amber-200 mt-2 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-semibold">Novo Pagamento</h4>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowAddPayment(false)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <PartialPaymentBuilder
                                                totalAmount={remainingAmount}
                                                paymentEntries={newPaymentEntries}
                                                onAddEntry={(entry: PaymentEntry) => setNewPaymentEntries([...newPaymentEntries, entry])}
                                                onRemoveEntry={(id: string) => setNewPaymentEntries(newPaymentEntries.filter(e => e.id !== id))}
                                                pixKeys={pixKeys}
                                            />

                                            <Button
                                                className="w-full"
                                                onClick={handleAddPayment}
                                                disabled={isAddingPayment || newPaymentEntries.length === 0}
                                            >
                                                {isAddingPayment ? "Salvando..." : "Confirmar Pagamento"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Delivery Fee Info */}
                            {order.is_delivery && order.delivery_fee && (
                                <div className="mt-2 flex justify-between items-center px-3 py-2 text-sm text-muted-foreground bg-muted/20 rounded-lg">
                                    <span>Taxa de Entrega</span>
                                    <span>{formatCurrency(order.delivery_fee)}</span>
                                </div>
                            )}
                        </div>

                        {/* Observações */}
                        {order.notes && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <h3 className="font-semibold">Observações</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        {order.notes}
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Total */}
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-semibold">Total</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                            </div>
                            {isPaid && (
                                <Badge className="mt-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                    Pago
                                </Badge>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="p-4 border-t bg-muted/20 space-y-3">
                    {(() => {
                        const replyUrl = buildWhatsAppClientReplyUrl(getWhatsAppReplyParamsFromOrder(order));
                        const hasPhone = !!order.clients?.phone;
                        return (
                            <Button
                                onClick={() => replyUrl && window.open(replyUrl, '_blank')}
                                disabled={!hasPhone}
                                title={!hasPhone ? "Cliente sem telefone" : undefined}
                                className={cn(
                                    "w-full h-12 text-base font-medium",
                                    hasPhone
                                        ? "bg-[#6B7A4D] hover:bg-[#5A6840] text-white"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                <WhatsAppIcon className="w-5 h-5 mr-2" />
                                Responder cliente
                            </Button>
                        );
                    })()}

                    {nextStatus && onStatusChange && (
                        <Button
                            onClick={() => {
                                onStatusChange(order.id, nextStatus);
                                onOpenChange(false);
                            }}
                            disabled={isUpdating}
                            className={cn(
                                "w-full h-12 text-base font-medium",
                                getActionButtonStyle(nextStatus)
                            )}
                        >
                            Marcar como {ORDER_STATUS_LABELS[nextStatus]}
                            <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    )}
                </div>
            </DialogContent>

            {selectedItem && (
                <OrderItemLinkingFlow
                    open={!!selectedItem}
                    onOpenChange={(open) => {
                        if (!open) setSelectedItem(null);
                    }}
                    product={selectedItem.product}
                    saleItemId={selectedItem.saleItemId}
                    orderId={order.id}
                    onStatusChange={onStatusChange}
                />
            )}
            {/* ALERT DIALOG */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O pedido será permanentemente removido e o estoque dos itens será restaurado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <NewOrderModal
                open={editOrderState.isOpen}
                onOpenChange={(open) => !open && editOrderState.close()}
                orderState={editOrderState}
            />

            {pixModalData && (
                <QRCodeModal
                    open={showPixModal}
                    onOpenChange={setShowPixModal}
                    pixKey={pixModalData.key}
                    amount={pixModalData.amount}
                />
            )}
        </Dialog>
    );
}

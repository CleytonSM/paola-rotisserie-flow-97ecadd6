import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { CheckCircle2, ArrowRight, QrCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QRCodeModal } from "@/components/features/pdv/QRCodeModal";
import { ReceiptSummary } from "@/components/features/pdv/success/ReceiptSummary";
import { printerService } from "@/services/printer/PrinterService";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { MessageSquare } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { useSoundNotifications } from "@/hooks/useSoundNotifications";

interface SuccessPageState {
    saleId?: string;
    displayId?: string;
    orderId?: string;
    total: number;
    subtotal: number;
    method: string;
    pixKey?: { key: string; key_value?: string };
    pixAmount?: number;
    clientName?: string;
    clientId?: string;
    clientPhone?: string;
    items?: any[];
    change?: number;
    isDelivery?: boolean;
    deliveryAddressId?: string;
    deliveryFee?: number;
}

export default function SuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state || {}) as SuccessPageState;
    const {
        saleId, displayId: numericId, total, subtotal, method,
        pixKey, pixAmount, orderId, clientName, items, change,
        clientId, clientPhone, isDelivery, deliveryAddressId, deliveryFee
    } = state;

    const finalDisplayId = numericId ? `#${numericId}` : (saleId || orderId)?.slice(0, 8);
    const [showPixModal, setShowPixModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const { settings } = useAppSettings();
    const { addresses } = useClientAddresses(clientId);
    const deliveryAddress = addresses.find(a => a.id === deliveryAddressId);
    const { playOrderCreated } = useSoundNotifications();

    const handleWhatsApp = () => {
        if (!settings || !deliveryAddress) return;

        const storeInfo = `*${settings.store_name || "Paola Gonçalves Rotisseria"}*\n *Retirada:* ${settings.store_address_street}, ${settings.store_address_number} - ${settings.store_address_neighborhood}\nCEP: ${settings.store_address_zip_code}`;

        const clientInfo = `*Entrega:* ${deliveryAddress.street}, ${deliveryAddress.number} ${deliveryAddress.complement ? `(${deliveryAddress.complement})` : ""} - ${deliveryAddress.neighborhood}\nCEP: ${deliveryAddress.zip_code}`;

        const message = `${storeInfo}\n\n${clientInfo}`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    const handlePrint = async () => {
        if (!items || items.length === 0) return;

        setIsPrinting(true);
        try {
            await printerService.printReceipt({
                storeName: settings.store_name || "Paola Gonçalves Rotisseria",
                date: new Date(),
                orderId: finalDisplayId,
                clientName: clientName,
                clientPhone: clientPhone,
                items: items.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price || item.base_price || 0,
                    total: (item.price || item.base_price || 0) * item.quantity
                })),
                subtotal: subtotal || 0,
                total: total || 0,
                paymentMethod: method === 'card_credit' ? 'Crédito' :
                    method === 'card_debit' ? 'Débito' :
                        method === 'pix' ? 'Pix' :
                            method === 'cash' || method === 'money' ? 'Dinheiro' :
                                method === 'multiple' ? 'Múltiplos Métodos' : method,
                change: change,
                isDelivery: isDelivery,
                deliveryFee: deliveryFee,
                deliveryAddress: deliveryAddress ? `${deliveryAddress.street}, ${deliveryAddress.number} - ${deliveryAddress.neighborhood}, ${deliveryAddress.city}/${deliveryAddress.state}` : undefined
            });
        } catch (error) {
            // Silently fail or minimal feedback, logic mainly depends on printer service
        } finally {
            setIsPrinting(false);
        }
    };

    const { clearCart } = useCartStore();

    useEffect(() => {
        if (!saleId && !orderId) {
            navigate("/pdv");
        } else {
            clearCart();
            // Play success sound for new order
            playOrderCreated();
        }
    }, [saleId, orderId, navigate, clearCart, playOrderCreated]);

    if (!saleId && !orderId) return null;

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-card p-8 rounded-3xl shadow-xl shadow-muted/50 max-w-md w-full text-center border border-border"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-emerald-100/50 dark:bg-emerald-900/30 p-4 rounded-full ring-8 ring-emerald-50/50 dark:ring-emerald-950/30">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-playfair font-bold text-foreground mb-2">
                    Venda Finalizada!
                </h1>
                <p className="text-muted-foreground mb-8 font-medium">
                    Tudo certo, o pedido foi registrado.
                </p>

                <ReceiptSummary
                    displayId={finalDisplayId}
                    clientName={clientName}
                    paymentMethod={method}
                    total={total}
                />

                <div className="space-y-3">
                    {pixKey && (method === 'pix' || method === 'multiple') && (
                        <Button
                            variant="outline"
                            className="w-full h-12 border-primary-200 text-primary-700 hover:bg-primary-50"
                            onClick={() => setShowPixModal(true)}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Ver QR Code {method === 'multiple' ? 'Pix' : 'Novamente'}
                        </Button>
                    )}

                    <Button
                        size="lg"
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => navigate("/pdv")}
                    >
                        Nova Venda
                        <ArrowRight className="ml-2 h-5 w-5 opacity-90" />
                    </Button>

                    {isDelivery && (
                        <Button
                            variant="outline"
                            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={handleWhatsApp}
                            disabled={!deliveryAddress}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar para Motoboy
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={handlePrint}
                        disabled={isPrinting}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        {isPrinting ? "Imprimindo..." : "Imprimir Comprovante"}
                    </Button>
                </div>
            </motion.div>

            {pixKey && (
                <QRCodeModal
                    open={showPixModal}
                    onOpenChange={setShowPixModal}
                    pixKey={pixKey.key_value || pixKey.key}
                    amount={pixAmount || total}
                />
            )}
        </div>
    );
}

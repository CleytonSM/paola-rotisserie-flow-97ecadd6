import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { CheckCircle2, ArrowRight, QrCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { QRCodeModal } from "@/components/pdv/QRCodeModal";
import { ReceiptSummary } from "@/components/pdv/success/ReceiptSummary";
import { printerService } from "@/services/printer/PrinterService";

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
    items?: any[];
    change?: number;
}

export default function SuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as SuccessPageState || {};
    const {
        saleId, displayId: numericId, total, subtotal, method,
        pixKey, pixAmount, orderId, clientName, items, change
    } = state;

    const finalDisplayId = numericId ? `#${numericId}` : (saleId || orderId)?.slice(0, 8);
    const [showPixModal, setShowPixModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = async () => {
        if (!items || items.length === 0) return;

        setIsPrinting(true);
        try {
            await printerService.printReceipt({
                storeName: "Paola Gonçalves Rotisseria",
                date: new Date(),
                orderId: finalDisplayId,
                clientName: clientName,
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
        }
    }, [saleId, orderId, navigate, clearCart]);

    if (!saleId && !orderId) return null;

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-white p-8 rounded-3xl shadow-xl shadow-stone-200/50 max-w-md w-full text-center border border-stone-100"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-emerald-100/50 p-4 rounded-full ring-8 ring-emerald-50/50">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-playfair font-bold text-stone-800 mb-2">
                    Venda Finalizada!
                </h1>
                <p className="text-stone-500 mb-8 font-medium">
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

                    <Button
                        variant="ghost"
                        className="w-full text-stone-500 hover:text-stone-700 hover:bg-stone-50"
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

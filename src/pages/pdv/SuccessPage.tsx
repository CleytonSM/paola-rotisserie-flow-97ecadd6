import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cartStore";
import { CheckCircle2, ArrowRight, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";
import { QRCodeModal } from "@/components/pdv/QRCodeModal";

export default function SuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { saleId, displayId: numericId, total, method, pixKey, pixAmount, orderId, clientName } = location.state || {}; // Support both new saleId and legacy orderId

    const finalDisplayId = numericId ? `#${numericId}` : (saleId || orderId)?.slice(0, 8);
    const [showPixModal, setShowPixModal] = useState(false);

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

                <div className="bg-stone-50/80 rounded-2xl p-6 mb-8 space-y-4 text-left border border-stone-100/50">
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                        <span className="text-stone-500 text-sm font-medium">Venda</span>
                        <span className="font-mono font-bold text-xl text-stone-700 tracking-tight">{finalDisplayId}</span>
                    </div>

                    {clientName && (
                        <div className="flex justify-between items-center">
                            <span className="text-stone-500 text-sm font-medium">Cliente</span>
                            <span className="font-semibold text-stone-700">{clientName}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-stone-500 text-sm font-medium">Pagamento</span>
                        <span className="capitalize font-semibold text-stone-700 bg-white px-3 py-1 rounded-full border border-stone-100 shadow-sm text-sm">
                            {method === 'card_credit' ? 'Crédito' :
                                method === 'card_debit' ? 'Débito' :
                                    method === 'pix' ? 'Pix' :
                                        method === 'cash' || method === 'money' ? 'Dinheiro' : method}
                        </span>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-stone-200/50">
                        <span className="text-stone-500 text-sm font-medium">Valor Total</span>
                        <span className="font-bold text-2xl text-emerald-600">{formatCurrency(total || 0)}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Show Pix Button only if Pix Key data is present */}
                    {method === 'pix' && pixKey && (
                        <Button
                            variant="outline"
                            className="w-full h-12 border-primary-200 text-primary-700 hover:bg-primary-50"
                            onClick={() => setShowPixModal(true)}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Ver QR Code Novamente
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
                </div>
            </motion.div>

            {/* Re-use QRCodeModal for post-checkout viewing */}
            {pixKey && (
                <QRCodeModal
                    open={showPixModal}
                    onOpenChange={setShowPixModal}
                    pixKey={pixKey.key_value || pixKey.key} // Handle potentially different field names depending on object source
                    amount={pixAmount || total}
                />
            )}
        </div>
    );
}

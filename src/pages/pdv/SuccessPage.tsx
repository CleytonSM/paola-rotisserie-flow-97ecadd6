import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { motion } from "framer-motion";

export default function SuccessPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, total, method } = location.state || {};

    useEffect(() => {
        if (!orderId) {
            navigate("/pdv");
        }
    }, [orderId, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-primary-100"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-playfair font-bold text-gray-800 mb-2">
                    Pedido Finalizado!
                </h1>
                <p className="text-gray-500 mb-8">
                    A venda foi registrada com sucesso.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 mb-8 space-y-3 text-left">
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Pedido #</span>
                        <span className="font-mono font-medium text-gray-700">{orderId?.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Valor Total</span>
                        <span className="font-bold text-gray-800">{formatCurrency(total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Pagamento</span>
                        <span className="capitalize text-gray-800">{method?.replace('_', ' ')}</span>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-white"
                    onClick={() => navigate("/pdv")}
                >
                    Novo Pedido
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </motion.div>
        </div>
    );
}

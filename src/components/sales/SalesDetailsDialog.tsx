import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import { Receipt, Calendar, User, Wallet, QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QRCodeModal } from "@/components/pdv/QRCodeModal";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPixKeys } from "@/services/database";

interface SalesDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: any | null;
}

export function SalesDetailsDialog({
    open,
    onOpenChange,
    sale
}: SalesDetailsDialogProps) {
    const [showPixModal, setShowPixModal] = useState(false);

    // Fetch pix keys for QR code display
    const { data: pixKeys } = useQuery({
        queryKey: ["pixKeys", "active"],
        queryFn: async () => {
            const { data, error } = await getPixKeys({ activeOnly: true });
            if (error) throw error;
            return data;
        },
        enabled: open,
    });

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setShowPixModal(false);
        }
    }, [open]);

    if (!sale) return null;

    const hasMultiplePayments = sale.sale_payments && sale.sale_payments.length > 1;

    // Check if there's a PIX payment
    const pixPayment = sale.sale_payments?.find((p: any) => p.payment_method === 'pix');
    const hasPixPayment = !!pixPayment;
    const pixKey = pixPayment?.pix_key_id
        ? pixKeys?.find((k: any) => k.id === pixPayment.pix_key_id)
        : pixKeys?.[0];

    const getPaymentMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            "credit_card": "Crédito",
            "card_credit": "Crédito",
            "debit_card": "Débito",
            "card_debit": "Débito",
            "pix": "Pix",
            "cash": "Dinheiro"
        };
        return methods[method] || method;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Venda #{sale.display_id || sale.id.slice(0, 8)}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Data</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">Cliente</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {sale.clients?.name || "Consumidor Final"}
                        </div>
                    </div>

                    {!hasMultiplePayments && (
                        <div className="space-y-1 col-span-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase">Pagamento</span>
                            <div className="flex items-center gap-2 text-sm font-medium capitalize">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                {sale.sale_payments?.map((p: any) => getPaymentMethodLabel(p.payment_method)).join(", ") || "-"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Payment Breakdown for Multiple Payments */}
                {hasMultiplePayments && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Divisão de Pagamento
                            </Label>
                            <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
                                {sale.sale_payments.map((payment: any, index: number) => (
                                    <div
                                        key={payment.id || index}
                                        className="flex items-center justify-between bg-white border rounded-lg p-2"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">
                                                {getPaymentMethodLabel(payment.payment_method)}
                                            </div>
                                            {payment.card_flag && (
                                                <div className="text-xs text-muted-foreground">
                                                    {payment.card_flag}
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-medium text-sm">
                                            {formatCurrency(payment.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <Separator />

                <div className="py-4 space-y-4">
                    <h4 className="text-sm font-medium leading-none">Itens do Pedido</h4>
                    <div className="space-y-3">
                        {sale.sale_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                    <span className="font-medium">{item.quantity}x</span>{' '}
                                    <span className="text-muted-foreground">{item.name}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(item.total_price)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator />

                <div className="pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(sale.total_amount)}</span>
                    </div>
                    {sale.change_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Troco</span>
                            <span>{formatCurrency(sale.change_amount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2">
                        <span>Total Pago</span>
                        <span className="text-emerald-600">{formatCurrency(sale.total_amount)}</span>
                    </div>
                </div>

                {/* Pix QR Code Button */}
                {hasPixPayment && pixKey && (
                    <div className="pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setShowPixModal(true)}
                        >
                            <QrCode className="mr-2 h-4 w-4" />
                            Ver QR Code Pix {hasMultiplePayments ? `(${formatCurrency(pixPayment.amount)})` : ''}
                        </Button>
                    </div>
                )}
            </DialogContent>

            {/* QR Code Modal */}
            {hasPixPayment && pixKey && (
                <QRCodeModal
                    open={showPixModal}
                    onOpenChange={setShowPixModal}
                    pixKey={pixKey.key_value || ""}
                    amount={pixPayment.amount}
                />
            )}
        </Dialog>
    );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/utils/format";
import { generatePixCode } from "@/utils/pix";

interface QRCodeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // value: string; // Removing value prop as we generate it internally or it can be passed as config
    // Actually user might want to pass 'pixKey' instead of 'value' string now?
    // Let's assume we pass pixKey. Or if value is passed, we treat it as PIX KEY? 
    // Previous code: <QRCodeModal ... value={pixKey} ... /> likely?
    // Let's keep 'value' as the Pix Key for now, but rename prop for clarity if possible, or just generate using 'value' as key.
    // The previous usage calling this might be passing a raw string. 
    // Let's see PaymentPage usage.
    pixKey: string;
    amount: number;
}

export function QRCodeModal({ open, onOpenChange, pixKey, amount }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false);

    // Generate the full payload dynamically
    const pixPayload = useMemo(() => {
        if (!pixKey || !amount) return "";
        return generatePixCode({
            pixKey,
            amount: amount,
            merchantName: "PAOLA ROTISSERIE", // Could be configurable
            merchantCity: "SAO PAULO"
        });
    }, [pixKey, amount]);

    const handleCopy = () => {
        navigator.clipboard.writeText(pixPayload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-playfair text-2xl">
                        Pagamento via Pix
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">Valor a pagar</p>
                        <p className="text-3xl font-bold text-primary-600">{formatCurrency(amount)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border-2 border-primary-100 shadow-sm">
                        <QRCodeSVG value={pixPayload} size={200} level="H" />
                    </div>

                    <div className="w-full space-y-2">
                        <p className="text-xs text-center text-gray-400">
                            Escaneie o QR Code acima ou copie o código abaixo
                        </p>
                        <div className="flex gap-2">
                            <Button
                                className="w-full"
                                variant={copied ? "default" : "outline"}
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copiar Código Pix
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

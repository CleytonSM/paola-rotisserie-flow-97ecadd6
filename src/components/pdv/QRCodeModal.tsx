import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/utils/format";

interface QRCodeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: string;
    amount: number;
}

export function QRCodeModal({ open, onOpenChange, value, amount }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
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
                        <QRCodeSVG value={value} size={200} level="H" />
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

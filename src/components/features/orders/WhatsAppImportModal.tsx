import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, MessageSquare, Sparkles } from "lucide-react";
import { NewOrderItem } from "@/hooks/useNewOrder";
import { Client } from "@/components/features/clients/types";
import { analyzeWhatsAppMessage } from "@/services/whatsappImportService";

interface WhatsAppImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: {
        items: NewOrderItem[],
        notes: string,
        scheduledPickup?: Date,
        client?: Client,
        clientName?: string
    }) => void;
}

export function WhatsAppImportModal({ open, onOpenChange, onImport }: WhatsAppImportModalProps) {
    const [text, setText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setIsAnalyzing(true);

        try {
            const result = await analyzeWhatsAppMessage(text);

            onImport({
                items: result.items,
                notes: result.notes,
                scheduledPickup: result.scheduledPickup,
                client: result.client,
                clientName: result.clientName
            });

            setText("");
            onOpenChange(false);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <MessageSquare className="h-5 w-5" />
                        Importar do WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        Cole a mensagem do cliente. O sistema detecta itens, horário e nome automaticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder={`Ex:
Quero 2 frangos assados
1 salada de maionese
Para retirar as 11:30`}
                        className="min-h-[200px] text-base resize-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />

                    <Button
                        onClick={handleAnalyze}
                        className="w-full font-bold shadow-sm bg-green-600 hover:bg-green-700 text-white"
                        disabled={isAnalyzing || !text.trim()}
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Analisando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Importar Mensagem
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

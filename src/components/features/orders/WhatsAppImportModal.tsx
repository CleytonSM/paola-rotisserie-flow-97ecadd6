import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, MessageSquare } from "lucide-react";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";
import { NewOrderItem } from "@/hooks/useNewOrder";

interface WhatsAppImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: {
        items: NewOrderItem[],
        notes: string,
        scheduledPickup?: Date,
        clientName?: string
    }) => void;
}

function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function normalize(text: string): string {
    let t = text.toLowerCase().trim();
    t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Plurais portugueses comuns
    if (t.endsWith("oes")) t = t.slice(0, -3) + "ao";
    else if (t.endsWith("aes")) t = t.slice(0, -3) + "ao";
    else if (t.endsWith("is") && t.length > 3) t = t.slice(0, -2) + "l";
    else if (t.endsWith("es") && t.length > 3) t = t.slice(0, -2);
    else if (t.endsWith("s") && t.length > 2) t = t.slice(0, -1);

    return t;
}

function findBestMatch(query: string, products: ProductCatalog[], maxDistance = 2): ProductCatalog | null {
    const normalizedQuery = normalize(query);
    let bestMatch: ProductCatalog | null = null;
    let bestScore = Infinity;

    for (const product of products) {
        const normalizedName = normalize(product.name);

        // Exact match after normalization
        if (normalizedName === normalizedQuery || normalizedName.includes(normalizedQuery)) {
            return product;
        }

        // Fuzzy match
        const distance = levenshtein(normalizedQuery, normalizedName);
        const threshold = Math.min(maxDistance, Math.floor(normalizedQuery.length * 0.3));

        if (distance <= threshold && distance < bestScore) {
            bestScore = distance;
            bestMatch = product;
        }

        // Check each word
        const words = normalizedName.split(' ');
        for (const word of words) {
            if (word.length < 3) continue;
            const wordDist = levenshtein(normalizedQuery, word);
            if (wordDist <= threshold && wordDist < bestScore) {
                bestScore = wordDist;
                bestMatch = product;
            }
        }
    }

    return bestMatch;
}

export function WhatsAppImportModal({ open, onOpenChange, onImport }: WhatsAppImportModalProps) {
    const [text, setText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setIsAnalyzing(true);

        const lines = text.split('\n');
        const detectedItems: NewOrderItem[] = [];
        let detectedNotes = "";
        let foundDate: Date | undefined = undefined;
        let clientName: string | undefined = undefined;

        const itemRegex = /(\d+(?:[.,]\d+)?)\s*(x|kg|g|un|unidades|unidade)?\s*(.+)/i;

        const wordToNumber: Record<string, number> = {
            meia: 0.5, metade: 0.5,
            um: 1, uma: 1,
            dois: 2, duas: 2,
            tres: 3, três: 3,
            quatro: 4, cinco: 5
        };

        const timePhrases = [
            /(\d{1,2})[h:]\s?(\d{0,2})\b/i,
            /(\d{1,2})(?::(\d{2}))?\s*(hs?|horas?)/i,
        ];

        const clientPatterns = [
            /(?:sou\s+(?:a|o)\s+)([a-záéíóúãõâêîôûç]+)/i,
            /(?:aqui\s+(?:é|e)\s+(?:a|o)?\s*)([a-záéíóúãõâêîôûç]+)/i,
            /(?:meu\s+nome\s+(?:é|e)\s*)([a-záéíóúãõâêîôûç]+)/i,
            /(?:oi|olá|ola),?\s+(?:sou\s+)?(?:a|o)?\s*([a-záéíóúãõâêîôûç]+)/i,
        ];

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            const lineLower = line.toLowerCase();
            let processed = false;

            // 1. Cliente
            if (!clientName) {
                for (const pattern of clientPatterns) {
                    const match = lineLower.match(pattern);
                    if (match && match[1]) {
                        const name = match[1].trim();
                        if (name.length >= 2 && !["quero", "gostaria", "preciso", "oi", "ola"].includes(name)) {
                            clientName = name.charAt(0).toUpperCase() + name.slice(1);
                            processed = true;
                            break;
                        }
                    }
                }
            }

            // 2. Horário
            if (!foundDate) {
                for (const regex of timePhrases) {
                    const match = lineLower.match(regex);
                    if (match) {
                        const hours = parseInt(match[1]);
                        const minutes = match[2] ? parseInt(match[2]) : 0;
                        if (hours < 24 && minutes < 60) {
                            const d = new Date();
                            d.setHours(hours, minutes, 0, 0);
                            foundDate = d;
                            processed = true;
                            break;
                        }
                    }
                }
            }

            // 3. Item (número + nome)
            const itemMatch = lineLower.match(itemRegex);
            if (itemMatch) {
                const qtyStr = itemMatch[1].replace(',', '.');
                let qty = parseFloat(qtyStr);

                if (isNaN(qty)) {
                    const firstWord = lineLower.split(' ')[0];
                    qty = wordToNumber[firstWord] || 1;
                }

                const rawName = itemMatch[3].trim();

                // Busca no catálogo com termo original e normalizado
                const { data: catalogData } = await searchProductCatalog(rawName);
                const { data: normalizedData } = await searchProductCatalog(normalize(rawName));

                const allProducts = [...(catalogData || []), ...(normalizedData || [])];
                const uniqueProducts = allProducts.filter((p, i, arr) =>
                    arr.findIndex(x => x.id === p.id) === i
                );

                const product = findBestMatch(rawName, uniqueProducts);

                if (product) {
                    detectedItems.push({
                        id: crypto.randomUUID(),
                        product,
                        quantity: qty,
                        unitPrice: product.base_price,
                        totalPrice: product.base_price * qty
                    });
                    processed = true;
                }
            }

            if (!processed) {
                detectedNotes += rawLine + "\n";
            }
        }

        onImport({
            items: detectedItems,
            notes: detectedNotes.trim(),
            scheduledPickup: foundDate,
            clientName
        });

        setIsAnalyzing(false);
        onOpenChange(false);
        setText("");
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
                        Cole a mensagem do cliente. O sistema identifica nome, itens, horário e tolera erros de digitação.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder="Ex:
Oi, sou a Paula
Quero 2 frangos assados
1 salada de maionese
Para retirar as 11:30"
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
                            "Analisar Mensagem"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

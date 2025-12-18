import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScanBarcode, Package, X } from "lucide-react";
import { ProductCatalog } from "@/services/database/product-catalog";
import { parseBarcode } from "@/utils/barcode";
import { toast } from "sonner";
import { createProductItem, ProductItem } from "@/services/database/product-items";
import { formatCurrency, toBrazilianFormat, toUSFormat, parseBrazilianNumber } from "@/utils/format";

interface QuickScanCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductCatalog;
    onSuccess: (item: ProductItem) => void;
}

export function QuickScanCreateDialog({ open, onOpenChange, product, onSuccess }: QuickScanCreateDialogProps) {
    const [barcode, setBarcode] = useState("");
    const [scannedItem, setScannedItem] = useState<{
        weight_kg: string; // Store as string for masking
        sale_price: string; // Store as string for masking
        scale_barcode: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setBarcode("");
            setScannedItem(null);
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [open]);

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode) return;

        const parsed = parseBarcode(barcode);

        // Basic validation: ensure the barcode matches the product (if it's a scale barcode)
        if (parsed.type === 'scale' && parsed.productId !== product.catalog_barcode?.toString()) {
            toast.error(`Este código (${parsed.productId}) não pertence a ${product.name}`);
            setBarcode("");
            return;
        }

        let weightNum = 0;
        let priceNum = 0;

        if (parsed.type === 'scale') {
            priceNum = parsed.value || 0;
            if (product.unit_type === 'kg') {
                if (product.base_price > 0) {
                    weightNum = Number((priceNum / product.base_price).toFixed(3));
                } else {
                    weightNum = 1.000;
                }
            } else {
                // Unit type 'un', weight shouldn't be 0
                weightNum = 1.000;
            }
        } else {
            // EAN or other
            priceNum = product.base_price;
            if (product.unit_type === 'un') {
                weightNum = 1.000;
            } else {
                toast.warning("Produtos por peso devem ser escaneados via etiqueta de balança.");
                setBarcode("");
                return;
            }
        }

        setScannedItem({
            weight_kg: toBrazilianFormat(weightNum.toFixed(3)),
            sale_price: toBrazilianFormat(priceNum.toFixed(2)),
            scale_barcode: barcode
        });
        setBarcode("");
    };

    const handleWeightChange = (val: string) => {
        if (!scannedItem) return;

        // Allow only numbers and one comma/period
        const cleaned = val.replace(/[^\d.,]/g, "");
        const weightNum = parseBrazilianNumber(cleaned);

        let priceStr = scannedItem.sale_price;
        if (product.unit_type === 'kg' && product.base_price > 0) {
            priceStr = toBrazilianFormat((weightNum * product.base_price).toFixed(2));
        }

        setScannedItem({ ...scannedItem, weight_kg: cleaned, sale_price: priceStr });
    };

    const handlePriceChange = (val: string) => {
        if (!scannedItem) return;

        // Allow only numbers and one comma/period
        const cleaned = val.replace(/[^\d.,]/g, "");
        const priceNum = parseBrazilianNumber(cleaned);

        let weightStr = scannedItem.weight_kg;
        if (product.unit_type === 'kg' && product.base_price > 0) {
            weightStr = toBrazilianFormat((priceNum / product.base_price).toFixed(3));
        }

        setScannedItem({ ...scannedItem, weight_kg: weightStr, sale_price: cleaned });
    };

    const handleConfirm = async () => {
        if (!scannedItem) return;

        const weightNum = parseBrazilianNumber(scannedItem.weight_kg);
        const priceNum = parseBrazilianNumber(scannedItem.sale_price);

        if (weightNum <= 0) {
            toast.error("O peso deve ser maior que zero.");
            return;
        }

        setIsSubmitting(true);
        const barcodeNumber = parseInt(scannedItem.scale_barcode, 10);

        const payload = {
            catalog_id: product.id,
            scale_barcode: isNaN(barcodeNumber) ? 0 : barcodeNumber,
            weight_kg: weightNum,
            sale_price: priceNum,
            produced_at: new Date().toISOString(),
            status: 'available' as const
        };

        const { data, error } = await createProductItem(payload);
        setIsSubmitting(false);

        if (error) {
            console.error("Error creating product item:", error);
            toast.error(error.message || "Erro ao criar item.");
        } else if (data) {
            toast.success("Item produzido e vinculado com sucesso!");
            onSuccess(data);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ScanBarcode className="h-6 w-6 text-primary" />
                        Vincular Produção
                    </DialogTitle>
                    <DialogDescription>
                        Escaneie a etiqueta de balança do item para continuar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!scannedItem ? (
                        <form onSubmit={handleScan} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="barcode" className="text-sm font-medium">Código de Barras</Label>
                                <div className="relative">
                                    <Input
                                        ref={inputRef}
                                        id="barcode"
                                        placeholder="Escaneie o código de barras..."
                                        value={barcode}
                                        onChange={(e) => setBarcode(e.target.value)}
                                        className="pr-10 h-11"
                                        autoFocus
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <ScanBarcode className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-12 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20">
                                <ScanBarcode className="h-16 w-16 text-muted-foreground/30 animate-pulse mb-3" />
                                <p className="text-sm text-muted-foreground font-medium text-center">
                                    Aguardando leitura do código de barras...
                                </p>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="p-5 bg-primary/5 rounded-xl border border-primary/20 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                                        <Package className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Produto</p>
                                        <p className="font-semibold text-lg leading-tight">{product.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Peso (kg)</Label>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={scannedItem.weight_kg}
                                            onChange={(e) => handleWeightChange(e.target.value)}
                                            className="h-10 text-lg font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Valor (R$)</Label>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={scannedItem.sale_price}
                                            onChange={(e) => handlePriceChange(e.target.value)}
                                            className="h-10 text-lg font-bold text-emerald-600"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-primary/10 flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Código</span>
                                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{scannedItem.scale_barcode}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-11"
                                    onClick={() => setScannedItem(null)}
                                    disabled={isSubmitting}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Limpar
                                </Button>
                                <Button
                                    className="flex-1 h-11 font-semibold"
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Vinculando..." : "Confirmar e Vincular"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

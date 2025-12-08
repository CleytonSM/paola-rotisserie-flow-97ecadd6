import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ScanBarcode, Plus } from "lucide-react";
import { ProductCatalog } from "@/components/ui/products/types";
import { parseBarcode } from "@/utils/barcode";
import { toast } from "sonner";
import { createProductItem } from "@/services/database";

interface BulkScanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    catalogProducts: ProductCatalog[];
    onSuccess: () => void;
}

interface PendingItem {
    id: string; // temp id for list management
    catalog_id: string;
    productName: string;
    scale_barcode?: string;
    ean_barcode?: string; // Original barcode scanned if it was an EAN
    weight_kg: number;
    sale_price: number;
    item_discount?: number; // Optional discount
    unit_type: 'kg' | 'un';
}

export function BulkScanDialog({ open, onOpenChange, catalogProducts, onSuccess }: BulkScanDialogProps) {
    const [scannedItems, setScannedItems] = useState<PendingItem[]>([]);
    const [currentBarcode, setCurrentBarcode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when dialog opens
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            setScannedItems([]);
            setCurrentBarcode("");
        }
    }, [open]);

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentBarcode) return;

        const parsed = parseBarcode(currentBarcode);

        // Find product in catalog
        // parsed.productId is string. catalog_barcode is number | null.
        // We compare as strings.
        let foundProduct: ProductCatalog | undefined;
        let weight = 0;
        let price = 0;
        let barcodeToSave = ""; // will convert to number later if needed

        if (parsed.type === 'scale') {
            foundProduct = catalogProducts.find(p => p.catalog_barcode?.toString() === parsed.productId);

            if (foundProduct) {
                barcodeToSave = parsed.rawValue;

                if (foundProduct.unit_type === 'kg') {
                    price = parsed.value || 0;
                    if (foundProduct.base_price > 0) {
                        weight = Number((price / foundProduct.base_price).toFixed(3));
                    }
                } else {
                    price = parsed.value || 0;
                    weight = 0;
                }
            }
        } else {
            // EAN
            foundProduct = catalogProducts.find(p => p.catalog_barcode?.toString() === parsed.productId);
            if (foundProduct) {
                barcodeToSave = parsed.rawValue;
                if (foundProduct.unit_type === 'un') {
                    weight = 0;
                    price = foundProduct.base_price;
                } else {
                    weight = 0;
                    price = 0;
                }
            }
        }

        if (!foundProduct) {
            toast.error(`Produto não encontrado para o código: ${parsed.productId}`);
            setCurrentBarcode("");
            return;
        }

        const newItem: PendingItem = {
            id: Math.random().toString(36).substr(2, 9),
            catalog_id: foundProduct.id,
            productName: foundProduct.name,
            scale_barcode: parsed.type === 'scale' ? barcodeToSave : undefined,
            ean_barcode: parsed.type === 'ean' ? barcodeToSave : undefined,
            weight_kg: weight,
            sale_price: price,
            unit_type: foundProduct.unit_type
        };

        setScannedItems(prev => [...prev, newItem]);
        setCurrentBarcode(""); // Clear input for next scan
        toast.success("Item adicionado!");
    };

    const handleRemoveItem = (id: string) => {
        setScannedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateItem = (id: string, field: keyof PendingItem, value: number) => {
        setScannedItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleFinish = async () => {
        if (scannedItems.length === 0) return;

        setIsSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const item of scannedItems) {
            // Parse scale_barcode to number for the API/Schema.
            const barcodeString = item.scale_barcode || item.ean_barcode || "0";
            const barcodeNumber = parseInt(barcodeString, 10);

            const payload = {
                catalog_id: item.catalog_id,
                scale_barcode: isNaN(barcodeNumber) ? 0 : barcodeNumber,
                weight_kg: item.weight_kg,
                sale_price: item.sale_price,
                item_discount: item.item_discount,
                produced_at: new Date().toISOString(),
                status: 'available' as const
            };

            const { error } = await createProductItem(payload);
            if (error) {
                console.error("Error creating item", error);
                errorCount++;
            } else {
                successCount++;
            }
        }

        setIsSubmitting(false);

        if (successCount > 0) {
            toast.success(`${successCount} itens criados com sucesso!`);
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} erros ao criar itens.`);
        }

        if (errorCount === 0) {
            onOpenChange(false);
            onSuccess();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScanBarcode className="h-5 w-5" />
                        Leitura em Lote
                    </DialogTitle>
                    <DialogDescription>
                        Escaneie os códigos de barras continuamente. Edite os valores se necessário antes de finalizar.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-[300px]">
                    {/* Scan Input */}
                    <form onSubmit={handleScan} className="flex gap-2 p-1">
                        <div className="flex-1">
                            <Label htmlFor="scanner_input" className="sr-only">Código de Barras</Label>
                            <Input
                                ref={inputRef}
                                id="scanner_input"
                                placeholder="Escaneie ou digite o código de barras..."
                                value={currentBarcode}
                                onChange={(e) => setCurrentBarcode(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <Button type="submit">Adicionar</Button>
                    </form>

                    {/* Pending Items List */}
                    <div className="border rounded-md overflow-y-auto flex-1">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="w-[120px]">Peso (kg)</TableHead>
                                    <TableHead className="w-[120px]">Preço (R$)</TableHead>
                                    <TableHead className="w-[120px]">Desconto (%)</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scannedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                                            Nenhum item escaneado ainda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    scannedItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.scale_barcode || item.ean_barcode}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.001"
                                                    value={item.weight_kg}
                                                    onChange={(e) => handleUpdateItem(item.id, 'weight_kg', parseFloat(e.target.value))}
                                                    disabled={item.unit_type === 'un'}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.sale_price}
                                                    onChange={(e) => handleUpdateItem(item.id, 'sale_price', parseFloat(e.target.value))}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0"
                                                    value={item.item_discount || ''}
                                                    onChange={(e) => handleUpdateItem(item.id, 'item_discount', parseFloat(e.target.value))}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <div className="flex-1 flex items-center text-sm text-muted-foreground">
                        {scannedItems.length} item(s) pendente(s)
                    </div>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleFinish} disabled={scannedItems.length === 0 || isSubmitting}>
                        {isSubmitting ? "Salvando..." : "Finalizar e Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

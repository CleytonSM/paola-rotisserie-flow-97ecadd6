import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/utils/format";
import { ProductCatalog } from "@/services/database/product-catalog";
import { ProductItem, getProductItems } from "@/services/database/product-items";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ProductItemSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductCatalog | null;
    onSelect: (item: ProductItem) => void;
    excludedItemIds?: string[];
}

export function ProductItemSelectionDialog({
    open,
    onOpenChange,
    product,
    onSelect,
    excludedItemIds = []
}: ProductItemSelectionDialogProps) {
    const [items, setItems] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && product) {
            loadItems();
        }
    }, [open, product]);

    const loadItems = async () => {
        if (!product) return;
        setLoading(true);
        const { data, error } = await getProductItems({
            catalog_id: product.id,
            status: 'available'
        });

        if (error) {
            toast.error("Erro ao carregar itens do produto");
        } else {
            const allItems = data || [];
            if (excludedItemIds.length > 0) {
                setItems(allItems.filter(item => !excludedItemIds.includes(item.id)));
            } else {
                setItems(allItems);
            }
        }
        setLoading(false);
    };

    const handleSelect = (item: ProductItem) => {
        onSelect(item);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Selecionar Item:
                        <span className="text-primary">{product?.name}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>Nenhum item disponível em estoque para este produto.</p>
                            <p className="text-sm mt-1">Verifique se há itens produzidos e não vendidos.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Peso</TableHead>
                                    <TableHead>Validade</TableHead>
                                    <TableHead className="text-right">Preço</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSelect(item)}>
                                        <TableCell className="font-mono text-xs">
                                            {item.scale_barcode}
                                        </TableCell>
                                        <TableCell>
                                            {item.weight_kg.toFixed(3)} kg
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(item.expires_at)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-lg text-primary">
                                            {formatCurrency(item.sale_price)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelect(item);
                                            }}>
                                                Selecionar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

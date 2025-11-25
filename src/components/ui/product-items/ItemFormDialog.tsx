import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { FormData, ProductItemStatus } from "./types";
import type { ProductCatalog } from "../products/types";
import { maskPrice, maskWeight, maskDiscount, getStatusLabel } from "./utils";

interface ItemFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    editingId: string | null;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    loading: boolean;
    catalogProducts: ProductCatalog[];
}

const statusOptions: ProductItemStatus[] = ['available', 'sold', 'reserved', 'expired', 'discarded'];

export function ItemFormDialog({
    open,
    onOpenChange,
    formData,
    setFormData,
    editingId,
    onSubmit,
    onReset,
    loading,
    catalogProducts,
}: ItemFormDialogProps) {
    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskWeight(e.target.value);
        setFormData({ ...formData, weight_kg: masked });
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskPrice(e.target.value);
        setFormData({ ...formData, sale_price: masked });
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskDiscount(e.target.value);
        setFormData({ ...formData, item_discount: masked });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Item" : "Novo Item"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Atualize as informações do item pesado."
                                : "Adicione um novo item pesado ao estoque."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Catalog Product Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="catalog_id">
                                Produto do Catálogo <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.catalog_id}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, catalog_id: value })
                                }
                                disabled={!!editingId}
                            >
                                <SelectTrigger id="catalog_id">
                                    <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catalogProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name} - {product.internal_code || 'Sem código'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Scale Barcode */}
                        <div className="grid gap-2">
                            <Label htmlFor="scale_barcode">
                                Código de Barras da Balança <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="scale_barcode"
                                type="number"
                                placeholder="Ex: 1234567890123"
                                value={formData.scale_barcode}
                                onChange={(e) =>
                                    setFormData({ ...formData, scale_barcode: e.target.value })
                                }
                                required
                                disabled={!!editingId}
                            />
                            <p className="text-xs text-muted-foreground">
                                Código único gerado pela balança
                            </p>
                        </div>

                        {/* Weight and Sale Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="weight_kg">
                                    Peso (kg) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="weight_kg"
                                    type="text"
                                    placeholder="Ex: 1.250"
                                    value={formData.weight_kg}
                                    onChange={handleWeightChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sale_price">
                                    Preço de Venda (R$) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="sale_price"
                                    type="text"
                                    placeholder="Ex: 57.38"
                                    value={formData.sale_price}
                                    onChange={handlePriceChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Item Discount */}
                        <div className="grid gap-2">
                            <Label htmlFor="item_discount">Desconto do Item (%)</Label>
                            <Input
                                id="item_discount"
                                type="text"
                                placeholder="Ex: 5.0"
                                value={formData.item_discount}
                                onChange={handleDiscountChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                Desconto específico para este item (ex: promoção por vencimento próximo)
                            </p>
                        </div>

                        {/* Produced At */}
                        <div className="grid gap-2">
                            <Label htmlFor="produced_at">Data de Produção</Label>
                            <Input
                                id="produced_at"
                                type="datetime-local"
                                value={formData.produced_at}
                                onChange={(e) =>
                                    setFormData({ ...formData, produced_at: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                A data de validade será calculada automaticamente
                            </p>
                        </div>

                        {/* Status (only for editing) */}
                        {editingId && (
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, status: value as ProductItemStatus })
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {getStatusLabel(status)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onReset();
                                onOpenChange(false);
                            }}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { FormData } from "./types";
import { maskPrice, maskDiscount } from "./utils";

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    editingId: string | null;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    loading: boolean;
}

export function ProductFormDialog({
    open,
    onOpenChange,
    formData,
    setFormData,
    editingId,
    onSubmit,
    onReset,
    loading,
}: ProductFormDialogProps) {
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskPrice(e.target.value);
        setFormData({ ...formData, price: masked });
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskDiscount(e.target.value);
        setFormData({ ...formData, discount: masked });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Produto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Produto" : "Novo Produto"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Atualize as informações do produto."
                                : "Adicione um novo produto ao catálogo."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Nome <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="Ex: Frango Assado"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                maxLength={35}
                                required
                            />
                        </div>

                        {/* Code and Barcode */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="code">Código</Label>
                                <Input
                                    id="code"
                                    placeholder="Ex: FRANG-001"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, code: e.target.value })
                                    }
                                    maxLength={50}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="barcode">Código de Barras</Label>
                                <Input
                                    id="barcode"
                                    type="number"
                                    placeholder="Ex: 7891234567890"
                                    value={formData.barcode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, barcode: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Price and Discount */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">
                                    Preço (R$) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="price"
                                    type="text"
                                    placeholder="Ex: 45.90"
                                    value={formData.price}
                                    onChange={handlePriceChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="discount">Desconto (%)</Label>
                                <Input
                                    id="discount"
                                    type="text"
                                    placeholder="Ex: 10"
                                    value={formData.discount}
                                    onChange={handleDiscountChange}
                                    max={100}
                                />
                            </div>
                        </div>

                        {/* Shelf Life Days */}
                        <div className="grid gap-2">
                            <Label htmlFor="shelf_life_days">Tempo de Validade (dias)</Label>
                            <Input
                                id="shelf_life_days"
                                type="number"
                                placeholder="Ex: 30"
                                value={formData.shelf_life_days}
                                onChange={(e) =>
                                    setFormData({ ...formData, shelf_life_days: e.target.value })
                                }
                                min={1}
                            />
                        </div>
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

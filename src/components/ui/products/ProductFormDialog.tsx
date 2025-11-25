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
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { maskPrice, maskDiscount } from "./utils";

interface FormValues {
    name: string;
    base_price: string;
    internal_code?: string;
    catalog_barcode?: string;
    shelf_life_days: string;
    default_discount?: string;
    is_active: boolean;
}

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<FormValues>;
    editingId: string | null;
    onSubmit: () => void;
    onReset: () => void;
    loading: boolean;
}

export function ProductFormDialog({
    open,
    onOpenChange,
    form,
    editingId,
    onSubmit,
    onReset,
    loading,
}: ProductFormDialogProps) {
    const { register, watch, setValue } = form;

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskPrice(e.target.value);
        setValue("base_price", masked);
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = maskDiscount(e.target.value);
        setValue("default_discount", masked);
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
                                ? "Atualize as informações do produto no catálogo."
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
                                {...register("name")}
                                maxLength={100}
                                required
                            />
                        </div>

                        {/* Internal Code and Catalog Barcode */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="internal_code">Código Interno</Label>
                                <Input
                                    id="internal_code"
                                    placeholder="Ex: FRANG-001"
                                    {...register("internal_code")}
                                    maxLength={50}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="catalog_barcode">Código de Barras</Label>
                                <Input
                                    id="catalog_barcode"
                                    type="number"
                                    placeholder="Ex: 7891234567890"
                                    {...register("catalog_barcode")}
                                />
                            </div>
                        </div>

                        {/* Base Price and Default Discount */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="base_price">
                                    Preço Base (R$/kg) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="base_price"
                                    type="text"
                                    placeholder="Ex: 45.90"
                                    value={watch("base_price")}
                                    onChange={handlePriceChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="default_discount">Desconto Padrão (%)</Label>
                                <Input
                                    id="default_discount"
                                    type="text"
                                    placeholder="Ex: 10.5"
                                    value={watch("default_discount")}
                                    onChange={handleDiscountChange}
                                />
                            </div>
                        </div>

                        {/* Shelf Life Days */}
                        <div className="grid gap-2">
                            <Label htmlFor="shelf_life_days">
                                Tempo de Validade (dias) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="shelf_life_days"
                                type="number"
                                placeholder="Ex: 3"
                                {...register("shelf_life_days")}
                                min={1}
                                required
                            />
                        </div>

                        {/* Is Active */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active" className="text-base">
                                    Produto Ativo
                                </Label>
                                <div className="text-sm text-muted-foreground">
                                    Produtos inativos não aparecem na listagem padrão
                                </div>
                            </div>
                            <Switch
                                id="is_active"
                                checked={watch("is_active")}
                                onCheckedChange={(checked) => setValue("is_active", checked)}
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

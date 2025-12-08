import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { maskPrice, maskDiscount } from "./utils";
import { ProductFormValues } from "@/hooks/useProductForm";
import { GenericFormDialog } from "@/components/ui/generic-form-dialog";


interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<ProductFormValues>;
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

    // Effect to force 'un' unit type when product is not internal
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'is_internal' && value.is_internal === false) {
                setValue('unit_type', 'un');
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, setValue]);

    return (
        <GenericFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={editingId ? "Editar Produto" : "Novo Produto"}
            description={editingId
                ? "Atualize as informações do produto no catálogo."
                : "Adicione um novo produto ao catálogo."}
            onSubmit={onSubmit}
            isEditing={!!editingId}
            loading={loading}
            onCancel={onReset}
            submitText={editingId ? "Atualizar" : "Criar"}
            triggerButton={
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Produto
                </Button>
            }
            maxWidth="sm:max-w-[600px]"
        >
            <div className="col-span-1 sm:col-span-2 grid gap-4">
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

                {/* New: Internal Product Switch */}
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                    <div className="space-y-0.5">
                        <Label htmlFor="is_internal" className="text-base">
                            Produto Interno
                        </Label>
                        <div className="text-sm text-muted-foreground">
                            Produtos internos requerem seleção de itens específicos
                        </div>
                    </div>
                    <Switch
                        id="is_internal"
                        checked={watch("is_internal")}
                        onCheckedChange={(checked) => setValue("is_internal", checked)}
                    />
                </div>

                {/* Catalog Barcode */}
                <div className="grid gap-2">
                    <Label htmlFor="catalog_barcode">Código de Barras</Label>
                    <Input
                        id="catalog_barcode"
                        type="number"
                        placeholder="Ex: 2000220"
                        {...register("catalog_barcode")}
                    />
                    <p className="text-xs text-muted-foreground">
                        Para produtos pesados, use o prefixo da balança (ex: 2000220)
                    </p>
                </div>

                {/* Unit Type */}
                {watch("is_internal") && (
                    <div className="grid gap-2">
                        <Label>Tipo de Unidade</Label>
                        <RadioGroup
                            defaultValue={watch("unit_type")}
                            onValueChange={(value) => setValue("unit_type", value as "kg" | "un")}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="kg" id="kg" />
                                <Label htmlFor="kg">Quilograma (kg)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="un" id="un" />
                                <Label htmlFor="un">Unidade (un)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                )}

                {/* Not Internal Quantity */}
                {!watch("is_internal") && (
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">
                            Quantidade <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            placeholder="Ex: 3"
                            {...register("quantity")}
                            min={1}
                            required
                        />
                    </div>
                )}

                {/* Base Price and Default Discount */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="base_price">
                            Preço Base (R$/{watch("unit_type") === "un" ? "un" : "kg"}) <span className="text-destructive">*</span>
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
                {watch("is_internal") && (
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
                )}

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
        </GenericFormDialog>
    );
}

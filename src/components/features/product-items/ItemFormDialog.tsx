import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/common/money-input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Controller, UseFormReturn } from "react-hook-form";
import type { ProductItemStatus } from "./types";
import type { ProductCatalog } from "../products/types";
import { getStatusLabel } from "./utils";
import type { ItemSchema } from "@/schemas/item.schema";
import { GenericFormDialog } from "@/components/common/generic-form-dialog";

interface ItemFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<ItemSchema>;
    editingId: string | null;
    onSubmit: (e?: React.BaseSyntheticEvent) => void;
    catalogProducts: ProductCatalog[];
}

const statusOptions: ProductItemStatus[] = ['available', 'sold', 'reserved', 'expired', 'discarded'];

export function ItemFormDialog({
    open,
    onOpenChange,
    form,
    editingId,
    onSubmit,
    catalogProducts,
}: ItemFormDialogProps) {
    const { control, watch, setValue, formState: { isSubmitting } } = form;

    return (
        <GenericFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={editingId ? "Editar Item" : "Novo Item"}
            description={editingId
                ? "Atualize as informações do item pesado."
                : "Adicione um novo item pesado ao estoque."}
            onSubmit={onSubmit}
            isEditing={!!editingId}
            loading={isSubmitting}
            onCancel={() => {
                form.reset();
                onOpenChange(false);
            }}
            triggerButton={
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Item
                </Button>
            }
            maxWidth="sm:max-w-[600px]"
        >
            <div className="col-span-1 sm:col-span-2 grid gap-4">
                {/* Catalog Product Selection */}
                <div className="grid gap-2">
                    <Label htmlFor="catalog_id">
                        Produto do Catálogo <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                        name="catalog_id"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    const product = catalogProducts.find(p => p.id === value);
                                    if (product) {
                                        if (product.unit_type === 'un') {
                                            setValue('weight_kg', 1);
                                            setValue('sale_price', product.base_price);
                                        } else {
                                            setValue('weight_kg', 0);
                                            setValue('sale_price', 0);
                                        }
                                    }
                                }}
                                disabled={!!editingId}
                            >
                                <SelectTrigger id="catalog_id">
                                    <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {catalogProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name} - {product.catalog_barcode || 'Sem código'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {/* Scale Barcode */}
                <div className="grid gap-2">
                    <Label htmlFor="scale_barcode">
                        Código de Barras da Balança <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                        name="scale_barcode"
                        control={control}
                        render={({ field }) => (
                            <Input
                                id="scale_barcode"
                                type="number"
                                placeholder="Ex: 1234567890123"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value)}
                                disabled={!!editingId}
                            />
                        )}
                    />
                    <p className="text-xs text-muted-foreground">
                        Código único gerado pela balança
                    </p>
                </div>

                {/* Weight and Sale Price */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="weight_kg">
                            {catalogProducts.find(p => p.id === watch('catalog_id'))?.unit_type === 'un' ? 'Unidade' : 'Peso (kg)'} <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                            name="weight_kg"
                            control={control}
                            render={({ field }) => (
                                <MoneyInput
                                    id="weight_kg"
                                    decimalPlaces={3}
                                    placeholder="Ex: 1,250"
                                    value={field.value || ''}
                                    onChange={(rawValue) => {
                                        field.onChange(rawValue);

                                        // Calculate price if product is by weight
                                        const product = catalogProducts.find(p => p.id === watch('catalog_id'));
                                        const weight = parseFloat(rawValue);
                                        if (product && product.unit_type === 'kg' && !isNaN(weight) && weight > 0) {
                                            const price = weight * product.base_price;
                                            setValue('sale_price', Number(price.toFixed(2)));
                                        }
                                    }}
                                    disabled={!!editingId || catalogProducts.find(p => p.id === watch('catalog_id'))?.unit_type === 'un'}
                                />
                            )}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sale_price">
                            Preço de Venda (R$) <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                            name="sale_price"
                            control={control}
                            render={({ field }) => (
                                <MoneyInput
                                    id="sale_price"
                                    placeholder="Ex: 57,38"
                                    value={field.value || ''}
                                    onChange={(val) => field.onChange(val)}
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Item Discount */}
                <div className="grid gap-2">
                    <Label htmlFor="item_discount">Desconto do Item (%)</Label>
                    <Controller
                        name="item_discount"
                        control={control}
                        render={({ field }) => (
                            <MoneyInput
                                id="item_discount"
                                placeholder="Ex: 0,05 (5%)"
                                value={field.value || ''}
                                onChange={(val) => field.onChange(val)}
                            />
                        )}
                    />
                    <p className="text-xs text-muted-foreground">
                        Desconto específico para este item (ex: promoção por vencimento próximo)
                    </p>
                </div>

                {/* Produced At */}
                <div className="grid gap-2">
                    <Label htmlFor="produced_at">Data de Produção</Label>
                    <Controller
                        name="produced_at"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                date={field.value ? new Date(field.value) : undefined}
                                setDate={(date) => field.onChange(date ? date.toISOString() : '')}
                                showTime={true}
                            />
                        )}
                    />
                    <p className="text-xs text-muted-foreground">
                        A data de validade será calculada automaticamente
                    </p>
                </div>

                {/* Status (only for editing) */}
                {editingId && (
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
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
                            )}
                        />
                    </div>
                )}
            </div>
        </GenericFormDialog>
    );
}

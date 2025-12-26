import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/common/money-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { maskPrice, maskDiscount } from "./utils";
import { ProductFormValues } from "@/hooks/useProductForm";
import { GenericFormDialog } from "@/components/ui/common/generic-form-dialog";
import { Loader2, Image as ImageIcon, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";


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
    const [uploading, setUploading] = useState(false);
    const imageUrl = watch("image_url");

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            setUploading(true);

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('products').getPublicUrl(filePath);

            setValue("image_url", data.publicUrl);
            toast.success("Imagem enviada com sucesso!");
        } catch (error) {
            toast.error("Erro ao enviar imagem");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.preventDefault();
        setValue("image_url", null);
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
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 w-full grid gap-2">
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

                    {/* Image Upload */}
                    <div className="flex-shrink-0">
                        <Label className="block mb-2 text-center sm:text-left">Imagem</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/50 group-hover:border-primary transition-colors">
                                    <AvatarImage src={imageUrl || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-transparent">
                                        {uploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                {imageUrl && (
                                    <button
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                                        type="button"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <Input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    disabled={uploading}
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                    <Upload className="h-3 w-3" />
                                    {imageUrl ? 'Alterar' : 'Enviar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="grid gap-2">
                    <Label htmlFor="description">Descrição Curta</Label>
                    <Textarea
                        id="description"
                        placeholder="Ex: Frango assado na brasa com ervas finas e batatas coradas."
                        {...register("description")}
                        maxLength={500}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        Aparecerá no catálogo público para os clientes.
                    </p>
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
                            min={0}
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
                        <MoneyInput
                            id="base_price"
                            placeholder="Ex: 45,90"
                            value={watch("base_price") || ""}
                            onChange={(val) => setValue("base_price", val)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="default_discount">Desconto Padrão (%)</Label>
                        <MoneyInput
                            id="default_discount"
                            placeholder="Ex: 10,5"
                            value={watch("default_discount") || ""}
                            onChange={(val) => setValue("default_discount", val)}
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

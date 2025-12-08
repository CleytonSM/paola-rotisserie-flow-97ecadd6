import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { catalogSchema, type CatalogSchemaType } from "@/schemas";
import type { ProductCatalog } from "@/components/ui/products/types";
import { percentToDecimal, decimalToPercent } from "@/components/ui/products/utils";

/**
 * Form schema for react-hook-form
 * Uses string inputs that will be transformed to numbers
 */
const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
    base_price: z.string().min(1, "Preço base é obrigatório"),
    // internal_code removed
    catalog_barcode: z.string().optional(),
    shelf_life_days: z.string().min(1, "Tempo de validade é obrigatório"),
    default_discount: z.string().optional(),
    unit_type: z.enum(["kg", "un"]).default("kg"),
    is_internal: z.boolean().default(true),
    is_active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof formSchema>;
type FormSchemaType = ProductFormValues;

interface UseProductFormProps {
    onSuccess: (id: string | null, data: CatalogSchemaType) => Promise<{ success: boolean }>;
}

/**
 * Custom hook to manage product form state with react-hook-form
 * Handles form validation, submission, and dialog state
 */
export const useProductForm = ({ onSuccess }: UseProductFormProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            base_price: "",
            // internal_code removed
            catalog_barcode: "",
            shelf_life_days: "",
            default_discount: "0",
            unit_type: "kg",
            is_internal: true,
            is_active: true,
        },
    });

    /**
     * Transform form data (strings) to catalog schema data (numbers)
     */
    const transformFormData = (data: FormSchemaType): CatalogSchemaType => {
        return {
            name: data.name,
            base_price: parseFloat(data.base_price),
            // internal_code removed
            catalog_barcode: data.catalog_barcode ? parseInt(data.catalog_barcode) : undefined,
            shelf_life_days: parseInt(data.shelf_life_days),
            default_discount: data.default_discount ? percentToDecimal(data.default_discount) : undefined,
            unit_type: data.unit_type,
            is_internal: data.is_internal,
            is_active: data.is_active,
        };
    };

    /**
     * Handle form submission
     */
    const handleSubmit = form.handleSubmit(async (data) => {
        setSubmitting(true);
        try {
            const transformedData = transformFormData(data);
            const result = await onSuccess(editingId, transformedData);

            if (result.success) {
                setDialogOpen(false);
                setEditingId(null);
                form.reset();
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                toast.error(err.issues[0].message);
            } else {
                toast.error("Erro inesperado ao processar formulário");
            }
        } finally {
            setSubmitting(false);
        }
    });

    /**
     * Populate form for editing an existing product
     */
    const handleEdit = (product: ProductCatalog) => {
        setEditingId(product.id);
        form.reset({
            name: product.name,
            base_price: product.base_price.toString(),
            // internal_code: product.internal_code || "",
            catalog_barcode: product.catalog_barcode?.toString() || "",
            shelf_life_days: product.shelf_life_days.toString(),
            default_discount: decimalToPercent(product.default_discount),
            unit_type: product.unit_type,
            is_internal: product.is_internal,
            is_active: product.is_active,
        });
        setDialogOpen(true);
    };

    /**
     * Handle dialog close
     */
    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setEditingId(null);
            form.reset();
        }
    };

    /**
     * Reset form to initial state
     */
    const resetForm = () => {
        form.reset();
        setEditingId(null);
    };

    return {
        form,
        dialogOpen,
        setDialogOpen: handleDialogClose,
        editingId,
        handleEdit,
        handleSubmit,
        resetForm,
        submitting,
    };
};

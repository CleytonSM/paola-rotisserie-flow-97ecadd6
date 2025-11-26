// hooks/useProductItems.ts
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { ProductItem, ProductItemStatus, FormData } from "@/components/ui/product-items/types";
import {
    getProductItems,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    markItemAsSold
} from "@/services/database";
import { percentToDecimal } from "@/components/ui/product-items/utils";

const itemSchema = z.object({
    catalog_id: z.string().min(1, "Produto do catálogo é obrigatório"),
    scale_barcode: z.number().positive("Código de barras deve ser um número positivo"),
    weight_kg: z.number().positive("Peso deve ser maior que zero"),
    sale_price: z.number().positive("Preço de venda deve ser maior que zero"),
    item_discount: z.number().min(0).max(1).optional(),
    produced_at: z.string().optional(),
    status: z.enum(['available', 'sold', 'reserved', 'expired', 'discarded']).optional(),
});

export function useProductItems() {
    const [items, setItems] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<ProductItemStatus | "all">("available");

    const loadItems = async () => {
        setLoading(true);
        const filters = statusFilter !== "all" ? { status: statusFilter } : undefined;
        const result = await getProductItems(filters);
        
        if (result.error) {
            toast.error("Erro ao carregar itens");
        } else if (result.data) {
            setItems(result.data as ProductItem[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadItems();
    }, [statusFilter]);

    const createItem = async (formData: FormData): Promise<boolean> => {
        try {
            const dataToValidate = {
                catalog_id: formData.catalog_id,
                scale_barcode: parseInt(formData.scale_barcode),
                weight_kg: parseFloat(formData.weight_kg),
                sale_price: parseFloat(formData.sale_price),
                item_discount: formData.item_discount ? percentToDecimal(formData.item_discount) : undefined,
                produced_at: formData.produced_at || undefined,
                status: formData.status,
            };

            const validated = itemSchema.parse(dataToValidate);
            const { error } = await createProductItem(validated);

            if (error) {
                toast.error("Erro ao criar item");
                return false;
            }
            
            toast.success("Item criado com sucesso!");
            loadItems();
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                toast.error(err.issues[0].message);
            } else {
                toast.error("Erro inesperado ao processar formulário");
            }
            return false;
        }
    };

    const updateItem = async (id: string, formData: FormData): Promise<boolean> => {
        try {
            const dataToValidate = {
                catalog_id: formData.catalog_id,
                scale_barcode: parseInt(formData.scale_barcode),
                weight_kg: parseFloat(formData.weight_kg),
                sale_price: parseFloat(formData.sale_price),
                item_discount: formData.item_discount ? percentToDecimal(formData.item_discount) : undefined,
                produced_at: formData.produced_at || undefined,
                status: formData.status,
            };

            const validated = itemSchema.parse(dataToValidate);
            const { error } = await updateProductItem(id, validated);

            if (error) {
                toast.error("Erro ao atualizar item");
                return false;
            }
            
            toast.success("Item atualizado com sucesso!");
            loadItems();
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                toast.error(err.issues[0].message);
            } else {
                toast.error("Erro inesperado ao processar formulário");
            }
            return false;
        }
    };

    const deleteItem = async (id: string): Promise<boolean> => {
        const { error } = await deleteProductItem(id);
        
        if (error) {
            toast.error("Erro ao excluir item");
            return false;
        }
        
        toast.success("Item excluído com sucesso!");
        loadItems();
        return true;
    };

    const markAsSold = async (id: string): Promise<boolean> => {
        const { error } = await markItemAsSold(id);
        
        if (error) {
            toast.error("Erro ao marcar item como vendido");
            return false;
        }
        
        toast.success("Item marcado como vendido!");
        loadItems();
        return true;
    };

    return {
        items,
        loading,
        statusFilter,
        setStatusFilter,
        createItem,
        updateItem,
        deleteItem,
        markAsSold,
        refreshItems: loadItems,
    };
}
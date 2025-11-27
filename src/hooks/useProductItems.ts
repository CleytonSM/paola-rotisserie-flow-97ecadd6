// hooks/useProductItems.ts
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { ProductItem, ProductItemStatus } from "@/components/ui/product-items/types";
import {
    getProductItems,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    markItemAsSold
} from "@/services/database";
import { itemSchema, type ItemSchema } from "@/schemas/item.schema";

export function useProductItems() {
    const [items, setItems] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<ProductItemStatus | "all">("available");
    const [editingId, setEditingId] = useState<string | null>(null);

    const form = useForm<ItemSchema>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            catalog_id: "",
            scale_barcode: 0,
            weight_kg: 0,
            sale_price: 0,
            item_discount: 0,
            produced_at: new Date().toISOString().slice(0, 16),
            status: "available",
        },
    });

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

    const onSubmit = async (data: ItemSchema) => {
        try {
            const apiData = {
                ...data,
                item_discount: data.item_discount || undefined,
                produced_at: data.produced_at || undefined,
            };

            const { error } = editingId
                ? await updateProductItem(editingId, apiData)
                : await createProductItem(apiData);

            if (error) {
                toast.error(editingId ? "Erro ao atualizar item" : "Erro ao criar item");
                return false;
            }

            toast.success(editingId ? "Item atualizado com sucesso!" : "Item criado com sucesso!");
            loadItems();
            form.reset();
            setEditingId(null);
            return true;
        } catch (err) {
            toast.error("Erro inesperado ao processar formulário");
            return false;
        }
    };

    const handleEdit = (item: ProductItem) => {
        setEditingId(item.id);
        form.reset({
            catalog_id: item.catalog_id,
            scale_barcode: item.scale_barcode,
            weight_kg: item.weight_kg,
            sale_price: item.sale_price,
            item_discount: item.item_discount || 0,
            produced_at: new Date(item.produced_at).toISOString().slice(0, 16),
            status: item.status,
        });
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

    const updateItemStatus = async (id: string, status: ProductItemStatus): Promise<boolean> => {
        const { error } = await updateProductItem(id, { status });

        if (error) {
            toast.error("Erro ao atualizar status do item");
            return false;
        }

        toast.success("Status atualizado com sucesso!");
        loadItems();
        return true;
    };

    const resetForm = () => {
        form.reset({
            catalog_id: "",
            scale_barcode: 0,
            weight_kg: 0,
            sale_price: 0,
            item_discount: 0,
            produced_at: new Date().toISOString().slice(0, 16),
            status: "available",
        });
        setEditingId(null);
    };

    // Modal states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Handlers
    const handleEditClick = (item: ProductItem) => {
        handleEdit(item);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        await deleteItem(deletingId);
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            resetForm();
        }
    };

    const handleFormSubmit = async (e?: React.BaseSyntheticEvent) => {
        if (e) {
            await form.handleSubmit(onSubmit)(e);
            setDialogOpen(false);
        }
    };

    return {
        items,
        loading,
        statusFilter,
        setStatusFilter,
        form,
        editingId,
        onSubmit: form.handleSubmit(onSubmit),
        handleEdit,
        deleteItem,
        markAsSold,
        updateItemStatus,
        resetForm,
        refreshItems: loadItems,
        // Modal states
        dialogOpen,
        setDialogOpen: handleDialogClose,
        deleteDialogOpen,
        setDeleteDialogOpen,
        // Handlers
        handleEditClick,
        handleDeleteClick,
        handleDeleteConfirm,
        handleFormSubmit,
    };
}
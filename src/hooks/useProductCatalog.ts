import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    getProductCatalog,
    createCatalogProduct,
    updateCatalogProduct,
    deleteCatalogProduct,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import type { ProductCatalog } from "@/components/ui/products/types";
import { catalogSchema, type CatalogSchemaType } from "@/schemas";
import { useProductForm } from "./useProductForm";
import { useProductStock } from "./useProductStock";

/**
 * Custom hook to manage product catalog data and CRUD operations
 * Handles authentication, data fetching, and all product operations
 */
export const useProductCatalog = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<ProductCatalog[]>([]);
    const [showInactive, setShowInactive] = useState(false);

    // Load data on mount and when showInactive changes
    useEffect(() => {
        const checkAuth = async () => {
            const { session } = await getCurrentSession();
            if (!session) {
                navigate("/auth");
                return;
            }
            loadData();
        };
        checkAuth();
    }, [navigate, showInactive]);

    const loadData = async () => {
        setLoading(true);
        const result = await getProductCatalog(!showInactive);
        if (result.error) {
            toast.error("Erro ao carregar produtos");
        } else if (result.data) {
            setProducts(result.data as ProductCatalog[]);
        }
        setLoading(false);
    };

    const createProduct = async (data: CatalogSchemaType) => {
        const validated = catalogSchema.parse(data);
        const { error } = await createCatalogProduct(validated);

        if (error) {
            toast.error("Erro ao criar produto");
            return { success: false, error };
        }

        toast.success("Produto criado com sucesso!");
        await loadData();
        return { success: true };
    };

    const updateProduct = async (id: string, data: CatalogSchemaType) => {
        const validated = catalogSchema.parse(data);
        const { error } = await updateCatalogProduct(id, validated);

        if (error) {
            toast.error("Erro ao atualizar produto");
            return { success: false, error };
        }

        toast.success("Produto atualizado com sucesso!");
        await loadData();
        return { success: true };
    };

    const deleteProduct = async (id: string) => {
        const { error } = await deleteCatalogProduct(id);

        if (error) {
            toast.error("Erro ao desativar produto");
            return { success: false, error };
        }

        toast.success("Produto desativado com sucesso!");
        await loadData();
        return { success: true };
    };

    const {
        form,
        dialogOpen,
        setDialogOpen,
        editingId,
        handleEdit,
        handleSubmit,
        resetForm,
        submitting
    } = useProductForm({
        onSuccess: async (id, data) => {
            if (id) {
                return await updateProduct(id, data);
            } else {
                return await createProduct(data);
            }
        },
    });

    // Extract catalog IDs for batch stock loading
    const catalogIds = useMemo(() => products.map(p => p.id), [products]);

    // Load all stock summaries automatically
    const { stockSummaries, loadingStock, isLoadingAll } = useProductStock({
        catalogIds,
        autoLoad: true,
    });

    // Table Controls
    const [searchTerm, setSearchTerm] = useState("");

    // Delete Dialog Controls
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Delete Handlers ---

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        await deleteProduct(deletingId);
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    return {
        products,
        loading,
        showInactive,
        setShowInactive,
        createProduct,
        updateProduct,
        deleteProduct,
        refreshProducts: loadData,
        form,
        dialogOpen,
        setDialogOpen,
        editingId,
        handleEdit,
        handleSubmit,
        resetForm,
        submitting,
        stockSummaries,
        loadingStock,
        isLoadingAll,
        handleDeleteClick,
        handleDeleteConfirm,
        searchTerm,
        setSearchTerm,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deletingId,
        setDeletingId,
    };
};

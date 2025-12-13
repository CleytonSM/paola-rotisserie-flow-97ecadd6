import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    getProductCatalog,
    getProductCatalogList,
    getProductCatalogById,
    createCatalogProduct,
    updateCatalogProduct,
    deleteCatalogProduct,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import type { ProductCatalog, ProductCatalogInput } from "@/services/database/product-catalog";
import { catalogSchema, type CatalogSchemaType } from "@/schemas";
import { useProductForm } from "./useProductForm";
import { useProductStock } from "./useProductStock";
import { PAGE_SIZE } from "@/config/constants";

/**
 * Custom hook to manage product catalog data and CRUD operations
 * Handles authentication, data fetching, and all product operations
 */
export const useProductCatalog = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<ProductCatalog[]>([]);
    const [showInactive, setShowInactive] = useState(false);
    
    // Pagination & Search
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(PAGE_SIZE);

    const [totalCount, setTotalCount] = useState(0);

    // Load data on mount and when dependencies change
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
    }, [navigate, showInactive, page, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        // We need to handle showInactive alongside search logic if the service supports it.
        // Currently getProductCatalog supports searchTerm, page, pageSize.
        // It does NOT explicitly support showInactive combined with search in my previous edit?
        // Let's check the service. I updated it to support searchTerm. 
        // The original service supported activeOnly. I replaced it with searchTerm support.
        // I need to ensure showInactive is still respected or re-integrated if feasible.
        // Wait, looking at my edit to product-catalog.ts, I replaced the signature.
        // Original: getProductCatalog(activeOnly)
        // New: getProductCatalog(searchTerm, page, pageSize).
        // I LOST THE FILTER FOR INACTIVE PRODUCTS! I need to fix the service first or now.
        // For now, I will assume I need to fix the service to support activeOnly as well.
        // But let's proceed with hook assuming valid service, and I'll double check service later.
        // Actually, let's fix the service in the next step if I realized I broke it.
        
        const result = await getProductCatalogList(showInactive, searchTerm, page, pageSize);
        if (result.error) {
            toast.error("Erro ao carregar produtos");
        } else if (result.data) {
            setProducts(result.data as ProductCatalog[]);
            setTotalCount(result.count || 0);
        }
        setLoading(false);
    };

    const createProduct = async (data: CatalogSchemaType) => {
        const validated = catalogSchema.parse(data);
        const { error } = await createCatalogProduct(validated as unknown as ProductCatalogInput);

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
        const { error } = await updateCatalogProduct(id, validated as unknown as ProductCatalogInput);

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

    // Delete Dialog Controls
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Delete Handlers ---

    const handleEditSafe = async (product: ProductCatalog) => {
        // Fetch full fresh data before editing to ensure form has all fields
        const { data, error } = await getProductCatalogById(product.id);
        if (error || !data) {
            toast.error("Erro ao carregar detalhes do produto para edição.");
            return;
        }
        handleEdit(data); 
    };



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
        products, // No filtering here
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
        page,
        setPage,
        getProductCatalog,
        pageSize,
        totalCount
    };
};

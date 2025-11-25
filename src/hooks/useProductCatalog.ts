import { useEffect, useState } from "react";
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

    return {
        products,
        loading,
        showInactive,
        setShowInactive,
        createProduct,
        updateProduct,
        deleteProduct,
        refreshProducts: loadData,
    };
};

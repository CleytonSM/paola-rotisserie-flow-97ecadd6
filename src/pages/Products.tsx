// pages/Products.tsx
import { useMemo, useState } from "react";
import { ProductFormDialog } from "@/components/ui/products/ProductFormDialog";
import { DeleteProductDialog } from "@/components/ui/products/DeleteProductDialog";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { ProductsTable } from "@/components/ui/products/ProductsTable";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { useProductForm } from "@/hooks/useProductForm";
import { useProductStock } from "@/hooks/useProductStock";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export const Products = () => {
    // Custom Hooks
    const { products, loading, createProduct, updateProduct, deleteProduct } = useProductCatalog();

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

    return (
        <div className="flex min-h-screen flex-col">
            <main className="container flex-1 py-8 md:py-12">
                <PageHeader
                    title="Catálogo de Produtos"
                    subtitle="Gerencie os produtos mestres do catálogo."
                    action={
                        <ProductFormDialog
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                            form={form}
                            editingId={editingId}
                            onSubmit={handleSubmit}
                            onReset={resetForm}
                            loading={submitting}
                        />
                    }
                    children={<AppBreadcrumb />}
                />

                <ProductsTable
                    products={products}
                    loading={loading}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    stockSummaries={stockSummaries}
                    loadingStock={loadingStock}
                    isLoadingAll={isLoadingAll}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                />
            </main>

            <DeleteProductDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
};
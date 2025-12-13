// pages/Products.tsx
import { useMemo, useState } from "react";
import { ProductFormDialog } from "@/components/ui/products/ProductFormDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { ProductsTable } from "@/components/ui/products/ProductsTable";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { useProductForm } from "@/hooks/useProductForm";
import { useProductStock } from "@/hooks/useProductStock";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Scaffolding } from "@/components/ui/Scaffolding";

export const Products = () => {
    // Custom Hooks
    const { products, loading, createProduct, updateProduct, deleteProduct,
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
        page,
        setPage,
        pageSize,
        totalCount
    } = useProductCatalog();

    return (
        <Scaffolding>
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
                count={totalCount}
                page={page}
                rowsPerPage={pageSize}
                onPageChange={setPage}
            />
            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                entityName="produto"
            />
        </Scaffolding>
    );
};
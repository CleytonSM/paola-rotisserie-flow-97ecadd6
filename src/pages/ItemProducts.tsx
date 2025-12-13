// pages/ItemProducts.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ItemFormDialog } from "@/components/features/product-items/ItemFormDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ItemsTable } from "@/components/features/product-items/ItemsTable";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useProductItems } from "@/hooks/useProductItems";
import { getInternalActiveCatalogProducts, ProductCatalog } from "@/services/database";
import { useAuth } from "@/hooks/useAuth";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { BulkScanDialog } from "@/components/features/product-items/BulkScanDialog";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";

export default function ItemProducts() {
    const navigate = useNavigate();

    // Auth check
    useAuth(navigate);

    // Data hooks - includes all filters for server-side filtering
    const {
        items,
        loading,
        statusFilter,
        setStatusFilter,
        searchTerm,
        setSearchTerm,
        productionDate,
        setProductionDate,
        expirationPreset,
        setExpirationPreset,
        form,
        editingId,
        markAsSold,
        updateItemStatus,
        dialogOpen,
        setDialogOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        handleEditClick,
        handleDeleteClick,
        handleDeleteConfirm,
        handleFormSubmit,
        refreshItems,
        page,
        setPage,
        pageSize,
        totalCount
    } = useProductItems();

    // Fetch internal and active catalog products for the dialogs
    const [internalActiveProducts, setInternalActiveProducts] = useState<ProductCatalog[]>([]);

    useEffect(() => {
        const loadCatalogProducts = async () => {
            const { data } = await getInternalActiveCatalogProducts();
            if (data) {
                setInternalActiveProducts(data);
            }
        };
        loadCatalogProducts();
    }, []);

    // Bulk Scan state
    const [bulkScanOpen, setBulkScanOpen] = useState(false);

    return (
        <Scaffolding>
            <PageHeader
                title="Itens de Produtos"
                subtitle="Gerencie os itens pesados individuais."
                action={
                    <ItemFormDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        form={form}
                        editingId={editingId}
                        onSubmit={handleFormSubmit}
                        catalogProducts={internalActiveProducts}
                    />
                }
                children={<AppBreadcrumb />}
            >
            </PageHeader>

            <ItemsTable
                items={items}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onMarkAsSold={markAsSold}
                onStatusChange={updateItemStatus}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                productionDate={productionDate}
                onProductionDateChange={setProductionDate}
                expirationPreset={expirationPreset}
                onExpirationPresetChange={setExpirationPreset}
                count={totalCount}
                page={page}
                rowsPerPage={pageSize}
                onPageChange={setPage}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                entityName="item de produto"
            />

            <BulkScanDialog
                open={bulkScanOpen}
                onOpenChange={setBulkScanOpen}
                catalogProducts={internalActiveProducts}
                onSuccess={() => {
                    refreshItems();
                }}
            />

            <Button
                size="lg"
                className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0 z-50"
                onClick={() => setBulkScanOpen(true)}
            >
                <ScanBarcode className="h-6 w-6" />
                <span className="sr-only">Leitura em Lote</span>
            </Button>
        </Scaffolding>
    );
}

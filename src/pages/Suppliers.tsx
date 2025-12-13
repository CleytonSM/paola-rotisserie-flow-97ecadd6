import { SupplierFormDialog } from "@/components/ui/suppliers/SupplierFormDialog";
import { SupplierTable } from "@/components/ui/suppliers/SupplierTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Scaffolding } from "@/components/ui/Scaffolding";

export default function Suppliers() {
  const {
    loading,
    suppliers,
    searchTerm,
    setSearchTerm,
    dialogOpen,
    setDialogOpen,
    editingId,
    deleteDialogOpen,
    setDeleteDialogOpen,
    form,
    onSubmit,
    handleEdit,
    handleDeleteClick,
    handleDeleteConfirm,
    page,
    setPage,
    pageSize,
    totalCount
  } = useSuppliers();

  return (
    <Scaffolding>
      <PageHeader
        title="Fornecedores"
        subtitle="Gerencie seus fornecedores."
        action={
          <SupplierFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            form={form}
            editingId={editingId}
            onSubmit={onSubmit}
          />
        }
        children={<AppBreadcrumb />}
      />

      <SupplierTable
        suppliers={suppliers}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        page={page}
        rowsPerPage={pageSize}
        count={totalCount}
        onPageChange={setPage}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        entityName="fornecedor"
      />
    </Scaffolding>
  );
}

import { PayableFormDialog } from "@/components/features/payable/PayableFormDialog";
import { PayableTable } from "@/components/features/payable/PayableTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { usePayable } from "@/hooks/usePayable";
import { Scaffolding } from "@/components/ui/Scaffolding";

export default function Payable() {
  const {
    loading,
    accounts,
    suppliers,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
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
    handleStatusChange,
    page,
    setPage,
    pageSize,
    totalCount
  } = usePayable();

  return (
    <Scaffolding>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Gerencie seus pagamentos e despesas."
        action={
          <PayableFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            form={form}
            suppliers={suppliers}
            editingId={editingId}
            onSubmit={onSubmit}
          />
        }
        children={<AppBreadcrumb />}
      />

      <PayableTable
        accounts={accounts}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChange}
        count={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        entityName="conta a pagar"
      />
    </Scaffolding>
  );
}

import { ReceivableFormDialog } from "@/components/ui/receivable/ReceivableFormDialog";
import { ReceivableTable } from "@/components/ui/receivable/ReceivableTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useReceivable } from "@/hooks/useReceivable";
import { Scaffolding } from "@/components/ui/Scaffolding";

export default function Receivable() {
  const {
    loading,
    accounts,
    clients,
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
    totalCount,
    isPartialPayment,
    setIsPartialPayment,
    paymentEntries,
    addPaymentEntry,
    removePaymentEntry,
    updatePaymentEntry,
    getTotalAllocated,
    getRemainingBalance
  } = useReceivable();

  return (
    <Scaffolding>
      <PageHeader
        title="Contas a Receber"
        subtitle="Gerencie suas entradas e recebimentos."
        action={
          <ReceivableFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            form={form}
            clients={clients}
            editingId={editingId}
            onSubmit={onSubmit}
            isPartialPayment={isPartialPayment}
            setIsPartialPayment={setIsPartialPayment}
            paymentEntries={paymentEntries}
            addPaymentEntry={addPaymentEntry}
            removePaymentEntry={removePaymentEntry}
            updatePaymentEntry={updatePaymentEntry}
            getTotalAllocated={getTotalAllocated}
            getRemainingBalance={getRemainingBalance}
          />
        }
        children={<AppBreadcrumb />}
      />

      <ReceivableTable
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
        entityName="conta a receber"
      />
    </Scaffolding>
  );
}

import { ReceivableFormDialog } from "@/components/ui/receivable/ReceivableFormDialog";
import { ReceivableTable } from "@/components/ui/receivable/ReceivableTable";
import { DeleteReceivableDialog } from "@/components/ui/receivable/DeleteReceivableDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useReceivable } from "@/hooks/useReceivable";

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
  } = useReceivable();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="container flex-1 py-8 md:py-12">
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
        />
      </main>

      <DeleteReceivableDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

import { GenericTable, ColumnDef } from "@/components/ui/generic-table";
import type { DateRange } from "react-day-picker";
import type { AccountPayable, StatusFilter, AccountStatus } from "./types";
import { PayableFilters } from "./PayableFilters";
import { DataTableAction } from "@/components/ui/data-table-action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, translateStatus, getStatusBadgeClass } from "./utils";

interface PayableTableProps {
  accounts: AccountPayable[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onEdit: (account: AccountPayable) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "pending" | "paid") => void;
}

export function PayableTable({
  accounts,
  loading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  onEdit,
  onDelete,
  onStatusChange,
}: PayableTableProps) {

  const columns: ColumnDef<AccountPayable>[] = [
    {
      header: "Fornecedor",
      cell: (account) => (
        <div className="py-4">
          <div className="font-medium text-foreground">{account.supplier?.name || "N/A"}</div>
          <div className="hidden text-sm text-muted-foreground md:inline">{account.notes}</div>
        </div>
      ),
    },
    {
      header: "Vencimento",
      cell: (account) => (
        <span className={cn("font-sans py-4", (account.status as AccountStatus) === "overdue" && "text-destructive")}>
          {formatDate(account.due_date)}
        </span>
      ),
    },
    {
      header: "Pagamento",
      cell: (account) => (
        <span className="font-sans py-4">{formatDate(account.payment_date)}</span>
      ),
    },
    {
      header: "Status",
      cell: (account) => (
        <div className="py-4">
          <Select
            value={account.status}
            onValueChange={(value) => onStatusChange(account.id, value as "pending" | "paid")}
          >
            <SelectTrigger className="h-auto w-auto min-w-[110px] border-0 bg-transparent p-0 focus:ring-0">
              <SelectValue asChild>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getStatusBadgeClass(account.status as AccountStatus)
                  )}
                >
                  {translateStatus(account.status as AccountStatus)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      header: "Valor",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (account) => (
        <span className="font-sans text-base font-medium tabular-nums text-destructive py-4">
          {formatCurrency(account.value)}
        </span>
      ),
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (account) => (
        <div className="py-4">
          <DataTableAction
            tooltip="Editar conta"
            onClick={() => onEdit(account)}
            className="hover:text-primary"
            icon={Pencil}
          />
          <DataTableAction
            tooltip="Excluir conta"
            onClick={() => onDelete(account.id)}
            className="hover:text-destructive"
            icon={Trash2}
          />
        </div>
      ),
    },
  ];

  return (
    <GenericTable
      columns={columns}
      data={accounts}
      isLoading={loading}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por fornecedor..."
      emptyStateMessage={
        statusFilter === "all" && searchTerm === "" && !dateRange?.from
          ? "Nenhuma conta registrada."
          : "Nenhuma conta encontrada com esses filtros."
      }
      filterControls={
        <PayableFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      }
    />
  );
}


import { GenericTable, ColumnDef } from "@/components/ui/generic-table";
import type { DateRange } from "react-day-picker";
import type { AccountReceivable, StatusFilter } from "./types";
import { ReceivableFilters } from "./ReceivableFilters";
import { DataTableAction } from "@/components/ui/data-table-action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDate,
  getAccountStatus,
  translateStatus,
  getStatusBadgeClass,
  maskCpfCnpj,
} from "./utils";

interface ReceivableTableProps {
  accounts: AccountReceivable[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onEdit: (account: AccountReceivable) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "pending" | "received") => void;
  count?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export function ReceivableTable({
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
  count,
  page,
  rowsPerPage,
  onPageChange,
}: ReceivableTableProps) {

  const columns: ColumnDef<AccountReceivable>[] = [
    {
      header: "Cliente",
      cell: (account) => (
        <div className="py-4">
          <div className="font-medium text-foreground">{account.client?.name || "Venda Avulsa"}</div>
          <div className="hidden text-sm text-muted-foreground md:inline">
            {maskCpfCnpj(account.client?.cpf_cnpj)}
          </div>
        </div>
      ),
    },
    {
      header: "Data de Entrada",
      cell: (account) => (
        <span className="font-sans py-4">{formatDate(account.entry_date)}</span>
      ),
    },
    {
      header: "Status",
      cell: (account) => {
        const status = getAccountStatus(account);
        return (
          <div className="py-4">
            <Select
              value={status}
              onValueChange={(value) => onStatusChange(account.id, value as "pending" | "received")}
            >
              <SelectTrigger className="h-auto w-auto min-w-[110px] border-0 bg-transparent p-0 focus:ring-0">
                <SelectValue asChild>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusBadgeClass(status)
                    )}
                  >
                    {translateStatus(status)}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
    {
      header: "Valor Líquido",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (account) => (
        <div className="text-right font-sans text-base font-medium tabular-nums text-secondary py-4">
          {formatCurrency(account.net_value)}
          {account.gross_value !== account.net_value && (
            <p className="text-xs font-normal text-muted-foreground line-through">
              {formatCurrency(account.gross_value)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (account) => (
        <div className="py-4">
          <DataTableAction
            tooltip="Editar entrada"
            onClick={() => onEdit(account)}
            className="hover:text-secondary"
            icon={Pencil}
          />
          <DataTableAction
            tooltip="Excluir entrada"
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
      searchPlaceholder="Buscar por cliente..."
      emptyStateMessage={
        statusFilter === "all" && searchTerm === ""
          ? "Nenhuma entrada registrada."
          : "Nenhuma entrada encontrada com esses filtros."
      }
      filterControls={
        <ReceivableFilters
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      }
      count={count}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
    />
  );
}


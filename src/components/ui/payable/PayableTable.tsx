import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DateRange } from "react-day-picker";
import type { AccountPayable, StatusFilter } from "./types";
import { PayableFilters } from "./PayableFilters";
import { PayableTableRow } from "./PayableTableRow";

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
  return (
    <Card className="overflow-hidden shadow-md shadow-[#F0E6D2]/30">
      <CardHeader className="flex flex-col gap-4 border-b bg-accent/30 p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <PayableFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
        />
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-display text-xs uppercase tracking-wide">
                  Fornecedor
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide">
                  Vencimento
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide">
                  Pagamento
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide text-right">
                  Valor
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {statusFilter === "all" && searchTerm === "" && !dateRange?.from
                      ? "Nenhuma conta registrada."
                      : "Nenhuma conta encontrada com esses filtros."}
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <PayableTableRow
                    key={account.id}
                    account={account}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


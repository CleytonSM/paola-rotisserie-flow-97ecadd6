import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccountReceivable, StatusFilter } from "./types";
import { ReceivableFilters } from "./ReceivableFilters";
import { ReceivableTableRow } from "./ReceivableTableRow";
import { getAccountStatus } from "./utils";

interface ReceivableTableProps {
  accounts: AccountReceivable[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  onEdit: (account: AccountReceivable) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "pending" | "received") => void;
}

export function ReceivableTable({
  accounts,
  loading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onStatusChange,
}: ReceivableTableProps) {
  return (
    <Card className="overflow-hidden shadow-md shadow-[#F0E6D2]/30">
      <CardHeader className="flex flex-col gap-4 border-b bg-accent/30 p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <ReceivableFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
        />
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-display text-xs uppercase tracking-wide">
                  Cliente
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide">
                  Data de Entrada
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide text-right">
                  Valor Líquido
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {statusFilter === "all" && searchTerm === ""
                      ? "Nenhuma entrada registrada."
                      : "Nenhuma entrada encontrada com esses filtros."}
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <ReceivableTableRow
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


import { DataTableAction } from "@/components/ui/data-table-action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountPayable, AccountStatus } from "./types";
import { formatCurrency, formatDate, translateStatus, getStatusBadgeClass } from "./utils";

interface PayableTableRowProps {
  account: AccountPayable;
  onEdit: (account: AccountPayable) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "pending" | "paid") => void;
}

export function PayableTableRow({
  account,
  onEdit,
  onDelete,
  onStatusChange,
}: PayableTableRowProps) {
  const status = account.status as AccountStatus;

  return (
    <TableRow key={account.id} className="hover:bg-accent/30">
      <TableCell className="py-4">
        <div className="font-medium text-foreground">{account.supplier?.name || "N/A"}</div>
        <div className="hidden text-sm text-muted-foreground md:inline">{account.notes}</div>
      </TableCell>
      <TableCell className={cn("font-sans", status === "overdue" && "text-destructive")}>
        {formatDate(account.due_date)}
      </TableCell>
      <TableCell className="font-sans">{formatDate(account.payment_date)}</TableCell>
      <TableCell>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(account.id, value as "pending" | "paid")}
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
            <SelectItem value="paid">Pago</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right font-sans text-base font-medium tabular-nums text-destructive">
        {formatCurrency(account.value)}
      </TableCell>
      <TableCell className="text-right">
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
      </TableCell>
    </TableRow>
  );
}


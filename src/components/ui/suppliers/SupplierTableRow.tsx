import { DataTableAction } from "@/components/ui/data-table-action";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import type { Supplier } from "./types";
import { maskCnpj, maskPhone } from "./utils";

interface SupplierTableRowProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

export function SupplierTableRow({ supplier, onEdit, onDelete }: SupplierTableRowProps) {
  return (
    <TableRow key={supplier.id} className="hover:bg-accent/30">
      <TableCell className="py-4">
        <div className="font-medium text-foreground">{supplier.name}</div>
        <div className="text-sm text-muted-foreground">{supplier.email}</div>
      </TableCell>
      <TableCell className="font-sans tabular-nums text-muted-foreground">
        {supplier.cnpj ? maskCnpj(supplier.cnpj) : "N/A"}
      </TableCell>
      <TableCell className="font-sans tabular-nums text-muted-foreground">
        {supplier.phone ? maskPhone(supplier.phone) : "N/A"}
      </TableCell>
      <TableCell className="text-right">
        <DataTableAction
          tooltip="Editar fornecedor"
          onClick={() => onEdit(supplier)}
          className="hover:text-primary"
          icon={Pencil}
        />
        <DataTableAction
          tooltip="Excluir fornecedor"
          onClick={() => onDelete(supplier.id)}
          className="hover:text-destructive"
          icon={Trash2}
        />
      </TableCell>
    </TableRow>
  );
}


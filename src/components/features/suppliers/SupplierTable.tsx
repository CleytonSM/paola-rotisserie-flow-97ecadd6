import { GenericTable, ColumnDef } from "@/components/ui/common/generic-table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Supplier } from "./types";

interface SupplierTableProps {
  suppliers: Supplier[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  count?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export function SupplierTable({
  suppliers,
  loading,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
  count,
  page,
  rowsPerPage,
  onPageChange,
}: SupplierTableProps) {
  const columns: ColumnDef<Supplier>[] = [
    {
      header: "Fornecedor",
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>
    },
    {
      header: "Documento",
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.cnpj || "-"}</span>
    },
    {
      header: "Telefone",
      cell: (row) => <span className="text-foreground/80">{row.phone || "-"}</span>
    },
    {
      header: "Ações",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row)}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <GenericTable
      data={suppliers}
      columns={columns}
      isLoading={loading}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por nome, documento..."
      emptyStateMessage="Nenhum fornecedor encontrado."
      count={count}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
    />
  );
}


import { GenericTable, ColumnDef } from "@/components/ui/generic-table";
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
      cell: (row) => <span className="font-medium text-stone-700">{row.name}</span>
    },
    {
      header: "Documento",
      cell: (row) => <span className="font-mono text-xs text-stone-500">{row.cnpj || "-"}</span>
    },
    {
      header: "Telefone",
      cell: (row) => <span className="text-stone-600">{row.phone || "-"}</span>
    },
    {
      header: "Ações",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row)}
            className="h-8 w-8 text-stone-400 hover:text-amber-600 hover:bg-amber-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.id)}
            className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50"
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


import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Supplier } from "./types";
import { SupplierFilters } from "./SupplierFilters";
import { SupplierTableRow } from "./SupplierTableRow";

interface SupplierTableProps {
  suppliers: Supplier[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

export function SupplierTable({
  suppliers,
  loading,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  return (
    <Card className="overflow-hidden shadow-md shadow-[#F0E6D2]/30">
      <CardHeader className="flex flex-col gap-4 border-b bg-accent/30 p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <SupplierFilters searchTerm={searchTerm} onSearchChange={onSearchChange} />
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
                  Documento
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide">
                  Telefone
                </TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wide text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {searchTerm === ""
                      ? "Nenhum fornecedor registrado."
                      : "Nenhum fornecedor encontrado."}
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <SupplierTableRow
                    key={supplier.id}
                    supplier={supplier}
                    onEdit={onEdit}
                    onDelete={onDelete}
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


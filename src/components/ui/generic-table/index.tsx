import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { DataTableAction } from "@/components/ui/data-table-action";
import { PAGE_SIZE } from "@/config/constants";
import { ColumnDef, GenericTableProps } from "./types";
import { GenericTableHeader } from "./header";
import { GenericTablePagination } from "./pagination";

// Re-export types for consumers
export type { ColumnDef, GenericTableProps };

/**
 * Componente de Tabela reutilizável com a identidade visual "Claude".
 * Inclui Card, Header com Busca/Filtros, e Tabela.
 */
export function GenericTable<T extends { id: string }>({
    data,
    columns,
    isLoading,
    searchTerm,
    onSearchChange,
    searchPlaceholder,
    filterControls,
    emptyStateMessage,
    onViewDetails,
    emptyStateSearchMessage = "Nenhum resultado encontrado.",
    count,
    page = 1,
    rowsPerPage = PAGE_SIZE,
    onPageChange
}: GenericTableProps<T>) {

    const hasSearch = searchTerm && searchTerm.length > 0;
    const totalPages = count ? Math.ceil(count / rowsPerPage) : 0;

    const displayColumns = React.useMemo(() => {
        if (!onViewDetails) return columns;

        const actionsColumn: ColumnDef<T> = {
            header: "Ações",
            headerClassName: "text-right",
            cellClassName: "text-right",
            cell: (row) => (
                <DataTableAction
                    tooltip="Ver detalhes"
                    onClick={() => onViewDetails(row)}
                    icon={Eye}
                />
            )
        };

        return [...columns, actionsColumn];
    }, [columns, onViewDetails]);

    return (
        <Card className="overflow-hidden shadow-md shadow-[#F0E6D2]/30">
            {/* Cabeçalho com Busca e Filtros */}
            <GenericTableHeader
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                filterControls={filterControls}
            />

            {/* Conteúdo da Tabela */}
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {displayColumns.map((col) => (
                                    <TableHead
                                        key={col.header}
                                        className={`font-display text-xs uppercase tracking-wide ${col.headerClassName || ''}`}
                                    >
                                        {col.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={displayColumns.length} className="h-24 text-center text-muted-foreground">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={displayColumns.length} className="h-24 text-center text-muted-foreground">
                                        {hasSearch ? emptyStateSearchMessage : emptyStateMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-accent/30">
                                        {displayColumns.map((col, index) => (
                                            <TableCell
                                                key={`${row.id}-${index}`}
                                                className={`py-4 ${col.cellClassName || ''}`}
                                            >
                                                {col.cell(row)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Rodapé de Paginação */}
                <GenericTablePagination
                    count={count}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    isLoading={isLoading}
                />
            </CardContent>
        </Card>
    );
}

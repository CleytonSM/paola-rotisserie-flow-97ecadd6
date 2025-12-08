import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
import { DataTableAction } from "@/components/ui/data-table-action";
import { PAGE_SIZE } from "@/config/constants";

// Definição de tipo genérica para uma coluna
export interface ColumnDef<T> {
    header: string;
    cell: (row: T) => React.ReactNode;
    headerClassName?: string;
    cellClassName?: string;
}

interface GenericTableProps<T> {
    // Dados e Colunas
    data: T[];
    columns: ColumnDef<T>[];
    isLoading: boolean;

    // Controles de Busca
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    // Controles de Filtro (Slot)
    filterControls?: React.ReactNode;

    // Mensagens
    emptyStateMessage: string;
    emptyStateSearchMessage?: string;

    // Ações
    onViewDetails?: (item: T) => void;

    // Paginação
    count?: number;
    page?: number;
    rowsPerPage?: number;
    onPageChange?: (page: number) => void;
}

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
            <CardHeader className="flex flex-col gap-4 border-b bg-accent/30 p-4 md:flex-row md:items-center md:justify-between md:p-6">
                {(onSearchChange && searchTerm !== undefined) && (
                    <div className="relative w-full md:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                )}
                {filterControls && (
                    <div className="flex flex-wrap gap-2">
                        {filterControls}
                    </div>
                )}
            </CardHeader>

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
                {onPageChange && count !== undefined && count > 0 && (
                    <div className="flex items-center justify-between border-t p-4">
                        <div className="text-sm text-muted-foreground">
                            Página {page} de {totalPages} ({count} itens)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(Math.max(1, page - 1))}
                                disabled={page === 1 || isLoading}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                                disabled={page === totalPages || isLoading}
                            >
                                Próxima
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

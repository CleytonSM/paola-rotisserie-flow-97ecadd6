import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Printer } from "lucide-react";
import { DataTableAction } from "@/components/ui/data-table-action";
import { PAGE_SIZE } from "@/config/constants";
import { ColumnDef, GenericTableProps } from "./types";
import { GenericTableHeader } from "./header";
import { GenericTablePagination } from "./pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
    onPrint,
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
                <div className="flex justify-end gap-2">
                    {onPrint && (
                        <DataTableAction
                            tooltip="Imprimir comprovante"
                            onClick={() => onPrint(row)}
                            icon={Printer}
                        />
                    )}
                    {onViewDetails && (
                        <DataTableAction
                            tooltip="Ver detalhes"
                            onClick={() => onViewDetails(row)}
                            icon={Eye}
                        />
                    )}
                </div>
            )
        };

        return [...columns, actionsColumn];
    }, [columns, onViewDetails, onPrint]);

    const isMobile = useIsMobile();

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
                {isMobile ? (
                    <div className="p-4 space-y-4 bg-muted/5">
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                        ) : data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {hasSearch ? emptyStateSearchMessage : emptyStateMessage}
                            </div>
                        ) : (
                            data.map((row) => (
                                <Card key={row.id} className="p-4 flex flex-col gap-3 shadow-sm border-l-4 border-l-primary/40">
                                    {displayColumns.map((col, index) => {
                                        // Header can be string or ReactNode. Safely render it.
                                        const headerContent = typeof col.header === 'function'
                                            // @ts-ignore - header might be a function in some complex defs, but usually string
                                            ? col.header({ column: col } as any)
                                            : col.header;

                                        // Specific handling for "Actions" or empty headers to show them differently or at bottom
                                        const isActions = headerContent === "Ações" || col.id === "actions";

                                        return (
                                            <div key={`${row.id}-${index}`} className={`flex ${isActions ? 'justify-end mt-2 pt-2 border-t' : 'justify-between items-center'}`}>
                                                {!isActions && (
                                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                                        {headerContent}
                                                    </span>
                                                )}
                                                <span className={cn(isActions ? "w-full flex justify-end" : "text-sm text-right font-medium", col.cellClassName)}>
                                                    {col.cell(row)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {displayColumns.map((col, index) => {
                                        const headerContent = typeof col.header === 'function'
                                            // @ts-ignore
                                            ? col.header({ column: col } as any)
                                            : col.header;

                                        return (
                                            <TableHead
                                                key={col.id || index}
                                                className={`font-display text-xs uppercase tracking-wide ${col.headerClassName || ''}`}
                                            >
                                                {headerContent}
                                            </TableHead>
                                        );
                                    })}
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
                )}
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

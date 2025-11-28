import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
    emptyStateSearchMessage = "Nenhum resultado encontrado."
}: GenericTableProps<T>) {

    const hasSearch = searchTerm && searchTerm.length > 0;

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
                                {columns.map((col) => (
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
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                        {hasSearch ? emptyStateSearchMessage : emptyStateMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-accent/30">
                                        {columns.map((col, index) => (
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
            </CardContent>
        </Card>
    );
}

import * as React from "react";

// Definição de tipo genérica para uma coluna
export interface ColumnDef<T> {
    id?: string;
    header: string | ((props: { column: ColumnDef<T> }) => React.ReactNode);
    cell: (row: T) => React.ReactNode;
    headerClassName?: string;
    cellClassName?: string;
}

export interface GenericTableProps<T> {
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

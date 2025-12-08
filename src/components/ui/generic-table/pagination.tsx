import * as React from "react";
import { Button } from "@/components/ui/button";

interface GenericTablePaginationProps {
    count?: number;
    page: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
    isLoading: boolean;
}

export function GenericTablePagination({
    count,
    page,
    totalPages,
    onPageChange,
    isLoading
}: GenericTablePaginationProps) {
    if (!onPageChange || count === undefined || count <= 0) {
        return null;
    }

    return (
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
    );
}

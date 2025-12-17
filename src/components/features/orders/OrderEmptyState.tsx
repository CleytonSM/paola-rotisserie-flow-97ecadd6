import { ClipboardList } from "lucide-react";

interface OrderEmptyStateProps {
    hasFilters?: boolean;
}

export function OrderEmptyState({ hasFilters }: OrderEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <ClipboardList className="w-12 h-12 text-primary" />
            </div>

            <h3 className="text-xl font-semibold mb-2">
                {hasFilters ? "Nenhum pedido encontrado" : "Nenhum pedido agendado"}
            </h3>

            <p className="text-muted-foreground max-w-md">
                {hasFilters
                    ? "Tente ajustar os filtros para encontrar o que procura."
                    : "Quando você criar uma venda com agendamento de retirada, ela aparecerá aqui."
                }
            </p>
        </div>
    );
}

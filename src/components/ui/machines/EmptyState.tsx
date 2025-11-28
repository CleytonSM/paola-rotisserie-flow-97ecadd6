import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    onCreate: () => void;
}

export function EmptyState({ onCreate }: EmptyStateProps) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <h3 className="text-lg font-medium text-foreground">
                Nenhuma maquininha cadastrada
            </h3>
            <p className="text-muted-foreground mt-1 mb-4">
                Cadastre suas maquininhas de cartão para gerenciar taxas e bandeiras.
            </p>
            <Button variant="outline" onClick={onCreate}>
                Cadastrar Primeira
            </Button>
        </div>
    );
}
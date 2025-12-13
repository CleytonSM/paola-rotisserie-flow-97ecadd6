import { Button } from "@/components/ui/button";

interface PixKeysEmptyStateProps {
    onCreate: () => void;
}

export function PixKeysEmptyState({ onCreate }: PixKeysEmptyStateProps) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <h3 className="text-lg font-medium text-foreground">
                Nenhuma chave Pix cadastrada
            </h3>
            <p className="text-muted-foreground mt-1 mb-4">
                Cadastre suas chaves Pix para gerar QR Codes automaticamente.
            </p>
            <Button variant="outline" onClick={onCreate}>
                Cadastrar Primeira
            </Button>
        </div>
    );
}

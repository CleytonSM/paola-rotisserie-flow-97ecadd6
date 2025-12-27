import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionButton } from "./ActionButton";

interface QuickActionsProps {
    navigate: (path: string) => void;
}

export function QuickActions({ navigate }: QuickActionsProps) {
    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle className="text-3xl">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
                <ActionButton
                    onClick={() => navigate("/admin/receivable")}
                    icon={TrendingUp}
                    title="Adicionar Entrada"
                    description="Registrar novo recebimento"
                    variant="secondary"
                />
                <ActionButton
                    onClick={() => navigate("/admin/payable")}
                    icon={TrendingDown}
                    title="Adicionar Saída"
                    description="Registrar novo pagamento"
                    variant="primary"
                />
            </CardContent>
        </Card>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryRow } from "./SummaryRow";
import { SummarySkeleton } from "./SummarySkeleton";

interface Balance {
    balance: number;
}

interface SummaryProps {
    loading: boolean;
    balance: Balance;
    upcomingPayablesCount: number;
    suppliersCount: number;
    clientsCount: number;
}

export function Summary({
    loading,
    balance,
    upcomingPayablesCount,
    suppliersCount,
    clientsCount
}: SummaryProps) {
    if (loading) {
        return <SummarySkeleton />;
    }

    const balanceStatus = balance.balance >= 0 ? "Positivo" : "Negativo";
    const balanceColor = balance.balance >= 0 ? "text-secondary" : "text-destructive";

    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <CardTitle className="text-3xl">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <SummaryRow
                        label="Status do Saldo"
                        value={balanceStatus}
                        valueClassName={`font-semibold ${balanceColor}`}
                        hasBorder
                    />
                    <SummaryRow
                        label="Contas a Vencer em 7 dias"
                        value={upcomingPayablesCount.toString()}
                        hasBorder
                    />
                    <SummaryRow
                        label="Total de Fornecedores"
                        value={suppliersCount.toString()}
                        hasBorder
                    />
                    <SummaryRow
                        label="Total de Clientes"
                        value={clientsCount.toString()}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
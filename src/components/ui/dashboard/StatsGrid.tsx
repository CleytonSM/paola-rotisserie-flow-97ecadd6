import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign } from "lucide-react";
import { CombinedPayablesCard } from "./CombinedPayablesCard";
import { LoadingSkeleton } from "./LoadingSkeleton";

interface Balance {
    balance: number;
    totalReceivable: number;
    totalPayable: number;
}

interface StatsGridProps {
    loading: boolean;
    balance: Balance;
    unpaidPayablesCount: number;
    overduePayablesCount: number;
    formatCurrency: (value: number) => string;
}

export function StatsGrid({
    loading,
    balance,
    unpaidPayablesCount,
    overduePayablesCount,
    formatCurrency
}: StatsGridProps) {
    if (loading) {
        return <LoadingSkeleton count={4} />;
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
                title="Saldo Semanal"
                value={formatCurrency(balance.balance)}
                icon={DollarSign}
                variant={balance.balance >= 0 ? "success" : "warning"}
                trend="Últimos 7 dias"
            />

            <StatsCard
                title="Total Recebido"
                value={formatCurrency(balance.totalReceivable)}
                icon={TrendingUp}
                variant="success"
                trend="Últimos 7 dias"
            />

            <StatsCard
                title="Total Pago"
                value={formatCurrency(balance.totalPayable)}
                icon={TrendingDown}
                trend="Últimos 7 dias"
            />

            <CombinedPayablesCard
                unpaidCount={unpaidPayablesCount}
                overdueCount={overduePayablesCount}
            />
        </div>
    );
}
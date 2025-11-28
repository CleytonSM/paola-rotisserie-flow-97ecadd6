import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useDashboard } from "@/hooks/useDashboard";
import { StatsGrid } from "@/components/ui/dashboard/StatsGrid";
import { QuickActions } from "@/components/ui/dashboard/QuickActions";
import { Summary } from "@/components/ui/dashboard/Summary";

export default function Dashboard() {
  const {
    loading,
    balance,
    unpaidPayablesCount,
    clientsCount,
    suppliersCount,
    upcomingPayablesCount,
    profitData,
    overduePayablesCount,
    formatCurrency,
    formatMonthYear,
    navigate
  } = useDashboard();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="container flex-1 py-8 md:py-12">
        <PageHeader
          title="Dashboard"
          subtitle="Visão geral financeira dos últimos 7 dias."
          children={<AppBreadcrumb />}
        />

        <StatsGrid
          loading={loading}
          balance={balance}
          unpaidPayablesCount={unpaidPayablesCount}
          overduePayablesCount={overduePayablesCount}
          formatCurrency={formatCurrency}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-12 lg:grid-cols-2">
          <QuickActions navigate={navigate} />
          <Summary
            loading={loading}
            balance={balance}
            upcomingPayablesCount={upcomingPayablesCount}
            suppliersCount={suppliersCount}
            clientsCount={clientsCount}
          />
        </div>
      </main>
    </div>
  );
}
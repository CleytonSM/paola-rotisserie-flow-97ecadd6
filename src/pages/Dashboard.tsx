import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useDashboard } from "@/hooks/useDashboard";
import { StatsGrid } from "@/components/features/dashboard/StatsGrid";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import { Summary } from "@/components/features/dashboard/Summary";
import { TodayOrdersWidget } from "@/components/features/dashboard/TodayOrdersWidget";
import { Scaffolding } from "@/components/ui/Scaffolding";

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
    <Scaffolding>
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
        <TodayOrdersWidget />
      </div>

      <div className="mt-6">
        <Summary
          loading={loading}
          balance={balance}
          upcomingPayablesCount={upcomingPayablesCount}
          suppliersCount={suppliersCount}
          clientsCount={clientsCount}
        />
      </div>
    </Scaffolding>
  );
}


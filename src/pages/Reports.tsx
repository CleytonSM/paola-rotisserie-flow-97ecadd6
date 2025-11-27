
import { useNavigate } from "react-router-dom";
import { ReportsFilters } from "@/components/ui/reports/ReportsFilters";
import { ReportsKPIs } from "@/components/ui/reports/ReportsKPIs";
import { ReportsBarChart } from "@/components/ui/reports/ReportsBarChart";
import { ReportsPieChart } from "@/components/ui/reports/ReportsPieChart";
import { TopClientsList } from "@/components/ui/reports/TopClientsList";
import { TopSuppliersList } from "@/components/ui/reports/TopSuppliersList";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useReports } from "@/hooks/useReports";

export default function Reports() {
  const {
    loading,
    kpiData,
    barChartData,
    pieChartData,
    topClients,
    topSuppliers,
    exportToPDF,
    filter,
    setFilter,
    customDateRange,
    setCustomDateRange,
  } = useReports();

  return (
    <div className="flex min-h-screen flex-col">

      <main className="container flex-1 py-8 md:py-12">
        <PageHeader
          title="Relatórios"
          subtitle="Visão completa do fluxo financeiro."
          action={
            <ReportsFilters
              filter={filter}
              onFilterChange={setFilter}
              customDateRange={customDateRange}
              onCustomDateRangeChange={setCustomDateRange}
              onExport={exportToPDF}
            />
          }
          children={<AppBreadcrumb />}
        />

        {/* KPIs */}
        <ReportsKPIs kpiData={kpiData} />

        {/* Gráficos Principais */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ReportsBarChart data={barChartData} loading={loading} />
          <ReportsPieChart
            data={pieChartData}
            isEmpty={kpiData.totalReceived === 0 && kpiData.totalPaid === 0}
            loading={loading}
          />
        </div>

        {/* Listas Top 5 com Animação */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopClientsList clients={topClients} loading={loading} />
          <TopSuppliersList suppliers={topSuppliers} loading={loading} />
        </div>
      </main>
    </div>
  );
}
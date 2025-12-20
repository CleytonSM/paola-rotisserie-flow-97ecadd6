import { useNavigate } from "react-router-dom";
import { ReportsKPIs } from "@/components/features/reports/ReportsKPIs";
import { ReportsBarChart } from "@/components/features/reports/ReportsBarChart";
import { ReportsPieChart } from "@/components/features/reports/ReportsPieChart";
import { TopClientsList } from "@/components/features/reports/TopClientsList";
import { TopSuppliersList } from "@/components/features/reports/TopSuppliersList";
import { useReports } from "@/hooks/useReports";
import { ReportLayout } from "@/components/features/reports/ReportLayout";

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
    <ReportLayout
      title="Relatórios Gerais"
      subtitle="Visão completa do fluxo financeiro."
      filter={filter}
      setFilter={setFilter}
      customDateRange={customDateRange}
      setCustomDateRange={setCustomDateRange}
      onExport={exportToPDF}
    >
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
    </ReportLayout>
  );
}

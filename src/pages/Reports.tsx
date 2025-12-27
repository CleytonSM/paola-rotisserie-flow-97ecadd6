import { useMemo } from "react";
import { ReportsKPIs } from "@/components/features/reports/ReportsKPIs";
import { ReportsBarChart } from "@/components/features/reports/ReportsBarChart";
import { ReportsPieChart } from "@/components/features/reports/ReportsPieChart";
import { TopClientsList } from "@/components/features/reports/TopClientsList";
import { TopSuppliersList } from "@/components/features/reports/TopSuppliersList";
import { useReports } from "@/hooks/useReports";
import { ReportLayout } from "@/components/features/reports/ReportLayout";
import {
  exportToPdf,
  exportToCsv,
  generateReportFilename,
  generatePeriodLabel,
  generateWhatsAppPeriodLabel,
  generateWhatsAppReportMessage,
  openWhatsAppWithMessage,
  type CsvColumn,
} from "@/utils/exportUtils";
import { toast } from "sonner";

interface ReportSummaryRow {
  tipo: string;
  valor: number;
}

export default function Reports() {
  const {
    loading,
    kpiData,
    barChartData,
    pieChartData,
    topClients,
    topSuppliers,
    whatsAppSummary,
    filter,
    setFilter,
    customDateRange,
    setCustomDateRange,
    dateRange,
  } = useReports();

  const periodLabel = useMemo(() => {
    return generatePeriodLabel(dateRange);
  }, [dateRange]);

  const handleExportPdf = async () => {
    toast.info("Gerando PDF...");
    try {
      const filename = generateReportFilename("geral", "pdf", dateRange);
      await exportToPdf("report-content", filename, "Relatórios Gerais", periodLabel);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar PDF");
    }
  };

  const handleExportCsv = () => {
    const data: ReportSummaryRow[] = [
      { tipo: "Total Recebido", valor: kpiData.totalReceived },
      { tipo: "Total Pago", valor: kpiData.totalPaid },
      { tipo: "Saldo", valor: kpiData.balance },
    ];

    const columns: CsvColumn<ReportSummaryRow>[] = [
      { header: "Tipo", accessor: "tipo" },
      { header: "Valor (R$)", accessor: (item) => item.valor.toFixed(2) },
    ];

    const filename = generateReportFilename("geral", "csv", dateRange);
    exportToCsv(data, columns, filename);
    toast.success("CSV exportado com sucesso!");
  };

  const handleShareWhatsApp = () => {
    const whatsAppPeriod = generateWhatsAppPeriodLabel(dateRange, filter);

    const message = generateWhatsAppReportMessage({
      faturamento: whatsAppSummary.faturamento,
      pedidos: whatsAppSummary.pedidos,
      entregas: whatsAppSummary.entregas,
      topProduto: whatsAppSummary.topProduto,
      periodo: whatsAppPeriod,
    });

    openWhatsAppWithMessage(message);
    toast.success("Abrindo WhatsApp...");
  };

  return (
    <ReportLayout
      title="Relatórios Gerais"
      subtitle="Visão completa do fluxo financeiro."
      filter={filter}
      setFilter={setFilter}
      customDateRange={customDateRange}
      setCustomDateRange={setCustomDateRange}
      onExportPdf={handleExportPdf}
      onExportCsv={handleExportCsv}
      onShareWhatsApp={handleShareWhatsApp}
      loading={loading}
      periodLabel={periodLabel}
    >
      <ReportsKPIs kpiData={kpiData} />

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReportsBarChart data={barChartData} loading={loading} />
        <ReportsPieChart
          data={pieChartData}
          isEmpty={kpiData.totalReceived === 0 && kpiData.totalPaid === 0}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopClientsList clients={topClients} loading={loading} />
        <TopSuppliersList suppliers={topSuppliers} loading={loading} />
      </div>
    </ReportLayout>
  );
}

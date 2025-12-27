import { useProjections } from "@/hooks/useProjections";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { ProjectionKPIs } from "@/components/features/reports/ProjectionKPIs";
import { ProjectionChart } from "@/components/features/reports/ProjectionChart";
import { ProjectionTable } from "@/components/features/reports/ProjectionTable";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { exportToPdf, exportToCsv, generateReportFilename } from "@/utils/exportUtils";
import { format } from "date-fns";

export default function ReportsProjections() {
    const { data, loading, days, setDays, refresh } = useProjections();

    const handleExportPdf = async () => {
        toast.info("Gerando PDF...");
        try {
            const dateRange = { from: new Date(), to: new Date(new Date().setDate(new Date().getDate() + days)) };
            const periodLabel = `Próximos ${days} dias (${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')})`;
            const filename = generateReportFilename("projecoes", "pdf", dateRange);

            await exportToPdf("projection-report", filename, "Relatório de Projeções Financeiras", periodLabel);
            toast.success("PDF exportado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao exportar PDF");
        }
    };

    const handleExportCsv = () => {
        if (!data) return;

        // Flatten data for CSV
        const rows = [
            // Header or Summary
            { Data: "Resumo", Descricao: "Total a Pagar", Valor: data.kpis.totalToPay },
            { Data: "Resumo", Descricao: "Total a Receber", Valor: data.kpis.totalToReceive },
            { Data: "Resumo", Descricao: "Saldo Estimado", Valor: data.kpis.estimatedBalance },
            { Data: "", Descricao: "", Valor: "" }, // Spacer
            // Payables
            ...data.payablesTable.flatMap(row => row.items.map(item => ({
                Data: format(new Date(row.date), 'dd/MM/yyyy'),
                Tipo: "A Pagar",
                Descricao: item.origin,
                Valor: item.value
            }))),
            // Receivables
            ...data.receivablesTable.flatMap(row => row.items.map(item => ({
                Data: format(new Date(row.date), 'dd/MM/yyyy'),
                Tipo: "A Receber",
                Descricao: item.origin,
                Valor: item.value
            })))
        ];

        const dateRange = { from: new Date(), to: new Date(new Date().setDate(new Date().getDate() + days)) };
        const filename = generateReportFilename("projecoes", "csv", dateRange);

        exportToCsv(rows, [
            { header: "Data", accessor: "Data" },
            { header: "Tipo", accessor: (row: any) => row.Tipo || "" },
            { header: "Descrição", accessor: "Descricao" },
            { header: "Valor", accessor: (row: any) => typeof row.Valor === 'number' ? row.Valor.toFixed(2) : "" }
        ], filename);
        toast.success("CSV exportado com sucesso!");
    };

    return (
        <Scaffolding>
            <PageHeader
                title="Projeções Financeiras"
                subtitle="Analise o fluxo de caixa futuro e planeje melhor."
                children={<AppBreadcrumb />}
                action={
                    <div className="flex gap-2">
                        <Select value={String(days)} onValueChange={(v) => setDays(Number(v) as 7 | 15 | 30)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Próximos 7 dias</SelectItem>
                                <SelectItem value="15">Próximos 15 dias</SelectItem>
                                <SelectItem value="30">Próximos 30 dias</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={handleExportPdf} disabled={loading}>
                            <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleExportCsv} disabled={loading}>
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                }
            />

            <div id="projection-report" className="space-y-6">
                <ProjectionKPIs data={data?.kpis} loading={loading} days={days} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ProjectionChart data={data?.chartData} loading={loading} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProjectionTable
                        title="Contas a Pagar"
                        data={data?.payablesTable}
                        loading={loading}
                        type="payable"
                    />
                    <ProjectionTable
                        title="Contas a Receber"
                        data={data?.receivablesTable}
                        loading={loading}
                        type="receivable"
                    />
                </div>
            </div>
        </Scaffolding>
    );
}

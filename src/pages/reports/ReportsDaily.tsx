import { useEffect, useMemo } from "react";
import { ReportLayout } from "@/components/features/reports/ReportLayout";
import { useDetailedReports } from "@/hooks/useDetailedReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/components/features/reports/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import {
    exportToPdf,
    exportToCsv,
    generateReportFilename,
    generatePeriodLabel,
    type CsvColumn,
} from "@/utils/exportUtils";
import { toast } from "sonner";

interface DailyCsvRow {
    periodo: string;
    faturamento: number;
    vendas: number;
}

export default function ReportsDaily() {
    const {
        loading,
        filter,
        setFilter,
        customDateRange,
        setCustomDateRange,
        dateRange,
        salesByTime,
        fetchSalesByTime
    } = useDetailedReports();

    useEffect(() => {
        fetchSalesByTime();
    }, [filter, customDateRange]);

    const periodLabel = useMemo(() => {
        return generatePeriodLabel(dateRange);
    }, [dateRange]);

    const hourlyData = salesByTime.hourly.map(h => ({
        ...h,
        label: `${h.hour}h`
    }));

    const handleExportPdf = async () => {
        toast.info("Gerando PDF...");
        try {
            const filename = generateReportFilename("diario", "pdf", dateRange);
            await exportToPdf("report-content", filename, "Relatório por Dia/Hora", periodLabel);
            toast.success("PDF exportado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao exportar PDF");
        }
    };

    const handleExportCsv = () => {
        const hourlyRows: DailyCsvRow[] = salesByTime.hourly.map(h => ({
            periodo: `${h.hour}:00`,
            faturamento: h.value,
            vendas: h.count,
        }));

        const dailyRows: DailyCsvRow[] = salesByTime.daily.map(d => ({
            periodo: d.dayOfWeek,
            faturamento: d.value,
            vendas: d.count,
        }));

        const allData = [...hourlyRows, ...dailyRows];

        const columns: CsvColumn<DailyCsvRow>[] = [
            { header: "Período", accessor: "periodo" },
            { header: "Faturamento (R$)", accessor: (item) => item.faturamento.toFixed(2) },
            { header: "Vendas", accessor: "vendas" },
        ];

        const filename = generateReportFilename("diario", "csv", dateRange);
        exportToCsv(allData, columns, filename);
        toast.success("CSV exportado com sucesso!");
    };

    return (
        <ReportLayout
            title="Relatório por Dia/Hora"
            subtitle="Análise temporal das vendas."
            filter={filter}
            setFilter={setFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            loading={loading}
            periodLabel={periodLabel}
        >
            <Card>
                <CardHeader>
                    <CardTitle>Vendas por Hora do Dia</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {loading ? <Skeleton className="h-full w-full" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                                    labelFormatter={(label) => `Horário: ${label}`}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {hourlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? "hsl(var(--primary))" : "transparent"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Vendas por Dia da Semana</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {loading ? <Skeleton className="h-full w-full" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesByTime.daily} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="dayOfWeek" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), "Faturamento"]}
                                />
                                <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </ReportLayout>
    );
}

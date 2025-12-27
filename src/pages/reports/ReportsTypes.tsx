import { useEffect, useMemo } from "react";
import { ReportLayout } from "@/components/features/reports/ReportLayout";
import { useDetailedReports } from "@/hooks/useDetailedReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/components/features/reports/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
    exportToPdf,
    exportToCsv,
    generateReportFilename,
    generatePeriodLabel,
    type CsvColumn,
} from "@/utils/exportUtils";
import { toast } from "sonner";

const TYPE_COLORS: Record<string, string> = {
    "Balcão": "hsl(var(--primary))",
    "Entrega": "#3b82f6",
    "Agendado": "#1ab12eff",
};

const FALLBACK_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
];

const getColor = (type: string, index: number) => {
    return TYPE_COLORS[type] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

interface TypeCsvRow {
    tipo: string;
    total: number;
    vendas: number;
    percentual: number;
}

export default function ReportsTypes() {
    const {
        loading,
        filter,
        setFilter,
        customDateRange,
        setCustomDateRange,
        dateRange,
        salesByType,
        fetchSalesByType
    } = useDetailedReports();

    useEffect(() => {
        fetchSalesByType();
    }, [filter, customDateRange]);

    const periodLabel = useMemo(() => {
        return generatePeriodLabel(dateRange);
    }, [dateRange]);

    const handleExportPdf = async () => {
        toast.info("Gerando PDF...");
        try {
            const filename = generateReportFilename("tipos", "pdf", dateRange);
            await exportToPdf("report-content", filename, "Relatório por Tipo", periodLabel);
            toast.success("PDF exportado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao exportar PDF");
        }
    };

    const handleExportCsv = () => {
        const data: TypeCsvRow[] = salesByType.map(t => ({
            tipo: t.type,
            total: t.total,
            vendas: t.count,
            percentual: t.percentage,
        }));

        const columns: CsvColumn<TypeCsvRow>[] = [
            { header: "Tipo", accessor: "tipo" },
            { header: "Total (R$)", accessor: (item) => item.total.toFixed(2) },
            { header: "Vendas", accessor: "vendas" },
            { header: "Percentual (%)", accessor: (item) => item.percentual.toFixed(1) },
        ];

        const filename = generateReportFilename("tipos", "csv", dateRange);
        exportToCsv(data, columns, filename);
        toast.success("CSV exportado com sucesso!");
    };

    return (
        <ReportLayout
            title="Relatório por Tipo"
            subtitle="Balcão vs Entrega vs Agendado."
            filter={filter}
            setFilter={setFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
            onExportPdf={handleExportPdf}
            onExportCsv={handleExportCsv}
            loading={loading}
            periodLabel={periodLabel}
        >
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {loading ? <Skeleton className="h-full w-full rounded-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesByType}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="total"
                                        nameKey="type"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {salesByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getColor(entry.type, index)} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {salesByType.map((item, index) => (
                                <div key={item.type} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: getColor(item.type, index) }}
                                        />
                                        <span className="font-medium">{item.type}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(item.total)}</div>
                                        <div className="text-xs text-muted-foreground">{item.count}
                                            {item.count === 1 ? " venda" : " vendas"}</div>
                                    </div>
                                </div>
                            ))}
                            {!loading && salesByType.length === 0 && (
                                <p className="text-muted-foreground text-center">Nenhum dado encontrado.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ReportLayout>
    );
}

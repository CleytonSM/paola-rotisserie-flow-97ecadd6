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

const PAYMENT_COLORS: Record<string, string> = {
    "Dinheiro": "#22c55e",
    "Crédito": "#3b82f6",
    "Débito": "#ef4444",
};

const FALLBACK_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))"
];

const getColor = (method: string, index: number) => {
    return PAYMENT_COLORS[method] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

interface PaymentCsvRow {
    metodo: string;
    total: number;
    transacoes: number;
    percentual: number;
}

export default function ReportsPayments() {
    const {
        loading,
        filter,
        setFilter,
        customDateRange,
        setCustomDateRange,
        dateRange,
        salesByPayment,
        fetchSalesByPayment
    } = useDetailedReports();

    useEffect(() => {
        fetchSalesByPayment();
    }, [filter, customDateRange]);

    const periodLabel = useMemo(() => {
        return generatePeriodLabel(dateRange);
    }, [dateRange]);

    const handleExportPdf = async () => {
        toast.info("Gerando PDF...");
        try {
            const filename = generateReportFilename("pagamentos", "pdf", dateRange);
            await exportToPdf("report-content", filename, "Relatório por Pagamento", periodLabel);
            toast.success("PDF exportado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao exportar PDF");
        }
    };

    const handleExportCsv = () => {
        const data: PaymentCsvRow[] = salesByPayment.map(p => ({
            metodo: p.method,
            total: p.total,
            transacoes: p.count,
            percentual: p.percentage,
        }));

        const columns: CsvColumn<PaymentCsvRow>[] = [
            { header: "Método", accessor: "metodo" },
            { header: "Total (R$)", accessor: (item) => item.total.toFixed(2) },
            { header: "Transações", accessor: "transacoes" },
            { header: "Percentual (%)", accessor: (item) => item.percentual.toFixed(1) },
        ];

        const filename = generateReportFilename("pagamentos", "csv", dateRange);
        exportToCsv(data, columns, filename);
        toast.success("CSV exportado com sucesso!");
    };

    return (
        <ReportLayout
            title="Relatório por Pagamento"
            subtitle="Métodos de pagamento mais utilizados."
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
                        <CardTitle>Distribuição de Faturamento</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        {loading ? <Skeleton className="h-full w-full rounded-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salesByPayment}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="total"
                                        nameKey="method"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {salesByPayment.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getColor(entry.method, index)} />
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
                            {salesByPayment.map((item, index) => (
                                <div key={item.method} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: getColor(item.method, index) }}
                                        />
                                        <span className="font-medium">{item.method}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(item.total)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.count} {item.count === 1 ? "transação" : "transações"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!loading && salesByPayment.length === 0 && (
                                <p className="text-muted-foreground text-center">Nenhum dado encontrado.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ReportLayout>
    );
}

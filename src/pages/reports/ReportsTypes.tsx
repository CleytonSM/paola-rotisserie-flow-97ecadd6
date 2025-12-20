import { useEffect } from "react";
import { ReportLayout } from "@/components/features/reports/ReportLayout";
import { useDetailedReports } from "@/hooks/useDetailedReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/components/features/reports/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--secondary))"];

export default function ReportsTypes() {
    const {
        loading,
        filter,
        setFilter,
        customDateRange,
        setCustomDateRange,
        salesByType,
        fetchSalesByType
    } = useDetailedReports();

    useEffect(() => {
        fetchSalesByType();
    }, [filter, customDateRange]);

    return (
        <ReportLayout
            title="Relatório por Tipo"
            subtitle="Balcão vs Entrega vs Agendado."
            filter={filter}
            setFilter={setFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
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
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="total"
                                        nameKey="type"
                                    >
                                        {salesByType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                        <CardTitle>Resumo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {salesByType.map((item, index) => (
                                <div key={item.type} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="font-medium">{item.type}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(item.total)}</div>
                                        <div className="text-xs text-muted-foreground">{item.count} vendas</div>
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

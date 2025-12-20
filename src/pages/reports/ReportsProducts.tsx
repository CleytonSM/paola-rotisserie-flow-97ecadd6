import { useEffect } from "react";
import { ReportLayout } from "@/components/features/reports/ReportLayout";
import { useDetailedReports } from "@/hooks/useDetailedReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/components/features/reports/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function ReportsProducts() {
    const {
        loading,
        filter,
        setFilter,
        customDateRange,
        setCustomDateRange,
        topProducts,
        fetchTopProducts
    } = useDetailedReports();

    useEffect(() => {
        fetchTopProducts();
    }, [filter, customDateRange]);

    // Top 5 for chart
    const chartData = topProducts.slice(0, 5).map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
        full_name: p.name,
        quantity: p.quantity,
        total: p.totalValue
    }));

    return (
        <ReportLayout
            title="Relatório por Produto"
            subtitle="Desempenho de vendas por item."
            filter={filter}
            setFilter={setFilter}
            customDateRange={customDateRange}
            setCustomDateRange={setCustomDateRange}
        >
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Produtos (Quantidade)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: number) => [value, "Qtd"]}
                                        labelFormatter={(label) => chartData.find(c => c.name === label)?.full_name || label}
                                    />
                                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Produtos (Faturamento)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[...chartData].sort((a, b) => b.total - a.total)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), "Total"]}
                                        labelFormatter={(label) => chartData.find(c => c.name === label)?.full_name || label}
                                    />
                                    <Bar dataKey="total" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Qtd. Vendida</TableHead>
                                <TableHead className="text-right">Faturamento Total</TableHead>
                                <TableHead className="text-right">Preço Médio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : topProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                topProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="text-right">{product.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(product.totalValue)}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(product.totalValue / product.quantity)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </ReportLayout>
    );
}

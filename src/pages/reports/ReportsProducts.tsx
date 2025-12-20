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

    // Top 5 for chart - shorter names on mobile
    const chartData = topProducts.slice(0, 5).map(p => ({
        name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
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
            {/* Charts - stack on mobile, 2 cols on desktop */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg">Top 5 Produtos (Qtd)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] md:h-[300px]">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
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
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base md:text-lg">Top 5 Produtos (R$)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] md:h-[300px]">
                        {loading ? <Skeleton className="h-full w-full" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[...chartData].sort((a, b) => b.total - a.total)} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
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

            {/* Details Table */}
            <Card className="mt-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg">Detalhamento</CardTitle>
                </CardHeader>
                <CardContent className="px-2 md:px-6">
                    <div className="overflow-x-auto -mx-2 md:mx-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs md:text-sm">Produto</TableHead>
                                    <TableHead className="text-right text-xs md:text-sm">Qtd</TableHead>
                                    <TableHead className="text-right text-xs md:text-sm">Total</TableHead>
                                    <TableHead className="text-right text-xs md:text-sm hidden md:table-cell">Preço Médio</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24 md:w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-8 md:w-12" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 md:w-20" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : topProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground text-sm">
                                            Nenhum registro encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    topProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium text-xs md:text-sm max-w-[120px] md:max-w-none truncate">
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="text-right text-xs md:text-sm">{product.quantity}</TableCell>
                                            <TableCell className="text-right text-xs md:text-sm whitespace-nowrap">
                                                {formatCurrency(product.totalValue)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs md:text-sm whitespace-nowrap hidden md:table-cell">
                                                {formatCurrency(product.totalValue / product.quantity)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </ReportLayout>
    );
}


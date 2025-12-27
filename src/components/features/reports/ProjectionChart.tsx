import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyProjection } from "./types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { formatCurrency } from "@/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectionChartProps {
    data?: DailyProjection[];
    loading: boolean;
}

export function ProjectionChart({ data, loading }: ProjectionChartProps) {
    if (loading || !data) {
        return (
            <Card className="col-span-1 md:col-span-3 lg:col-span-3 border-primary/10 shadow-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-[200px]" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    // Determine min/max for domain to look nice
    const minVal = Math.min(...data.map(d => d.balance), 0);
    const maxVal = Math.max(...data.map(d => d.balance), 0);
    const domain = [minVal * 1.1, maxVal * 1.1];

    return (
        <Card className="col-span-1 md:col-span-3 lg:col-span-3 shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg font-semibold tracking-wide text-foreground">
                    Fluxo de Caixa Projetado
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Evolução estimada do saldo dia após dia
                </p>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                dy={10}
                                minTickGap={30}
                            />
                            <YAxis
                                tickFormatter={(value) => {
                                    if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
                                    return `R$ ${value.toFixed(0)}`;
                                }}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                domain={domain}
                                width={80}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), "Saldo Estimado"]}
                                labelFormatter={(label) => `Data: ${label}`}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderRadius: '8px',
                                    border: '1px solid hsl(var(--border))',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    color: 'hsl(var(--popover-foreground))'
                                }}
                            />
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

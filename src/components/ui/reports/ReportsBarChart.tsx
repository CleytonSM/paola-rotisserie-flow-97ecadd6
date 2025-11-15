import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { BarChartData } from "./types";
import { CustomBarTooltip } from "./CustomBarTooltip";

interface ReportsBarChartProps {
  data: BarChartData[];
}

export function ReportsBarChart({ data }: ReportsBarChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-wide">
          Fluxo de Caixa no Período
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8">
            <p className="text-center text-lg text-muted-foreground">
              Nenhum registro encontrado no período selecionado.
            </p>
          </div>
        ) : (
          <ChartContainer config={{}} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickFormatter={(value) => `R$${value / 1000}k`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <ChartTooltip content={<CustomBarTooltip />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="Entradas"
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { PieChartData } from "./types";
import { formatCurrency } from "./utils";

interface ReportsPieChartProps {
  data: PieChartData[];
  isEmpty: boolean;
}

export function ReportsPieChart({ data, isEmpty }: ReportsPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-wide">Entradas e Saídas</CardTitle>
      </CardHeader>
      <CardContent className="relative h-[350px] w-full">
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <p className="text-center text-lg text-muted-foreground">
              Nenhum registro encontrado no período selecionado.
            </p>
          </div>
        ) : (
          <ChartContainer config={{}} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={80}
                  paddingAngle={5}
                  cornerRadius={5}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}


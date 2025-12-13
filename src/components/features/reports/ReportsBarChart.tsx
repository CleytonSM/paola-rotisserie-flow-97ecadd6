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
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface ReportsBarChartProps {
  data: BarChartData[];
  loading?: boolean;
}

export function ReportsBarChart({ data, loading }: ReportsBarChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-wide">
          Fluxo de Caixa no Período
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <Skeleton className="h-full w-full rounded-lg" />
            </motion.div>
          ) : data.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center px-8"
            >
              <p className="text-center text-lg text-muted-foreground">
                Nenhum registro encontrado no período selecionado.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}


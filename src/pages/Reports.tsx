import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header"; // Importação real
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, LabelList, TooltipProps } from "recharts";
import { Download } from "lucide-react";
import { getAccountsReceivable, getAccountsPayable } from "@/services/database"; // Importação real
import { getCurrentSession } from "@/services/auth"; // Importação real
import { toast } from "sonner";
import { addDays, format, parseISO, startOfToday, subDays, subMonths, subQuarters, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

type AccountReceivable = { id: string; net_value: number; receipt_date: string; client?: { name: string } };
type AccountPayable = { id: string; value: number; payment_date: string; supplier?: { name: string } };

type ReportsFilter = "weekly" | "monthly" | "bimonthly" | "quarterly" | "semiannually" | "annually";

const filterOptions: { label: string; value: ReportsFilter }[] = [
  { label: "Últimos 7 dias", value: "weekly" },
  { label: "Últimos 30 dias", value: "monthly" },
  { label: "Últimos 2 meses", value: "bimonthly" },
  { label: "Últimos 3 meses", value: "quarterly" },
  { label: "Últimos 6 meses", value: "semiannually" },
  { label: "Último ano", value: "annually" },
];

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [filter, setFilter] = useState<ReportsFilter>("monthly");

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getCurrentSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadData();
    };
    checkAuth();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    const [recResult, payResult] = await Promise.all([
      getAccountsReceivable(),
      getAccountsPayable(),
    ]);

    if (recResult.error) {
      toast.error("Erro ao carregar entradas");
    } else if (recResult.data) {
      setReceivables(recResult.data as AccountReceivable[]);
    }

    if (payResult.error) {
      toast.error("Erro ao carregar saídas");
    } else if (payResult.data) {
      setPayables(payResult.data as AccountPayable[]);
    }

    setLoading(false);
  };

  const getStartDateFromFilter = (filter: ReportsFilter) => {
    const today = startOfToday();
    switch (filter) {
      case "weekly": return subDays(today, 7);
      case "monthly": return subDays(today, 30);
      case "bimonthly": return subMonths(today, 2);
      case "quarterly": return subMonths(today, 3);
      case "semiannually": return subMonths(today, 6);
      case "annually": return subYears(today, 1);
      default: return subDays(today, 30);
    }
  };

  const { filteredReceivables, filteredPayables } = useMemo(() => {
    const startDate = getStartDateFromFilter(filter);
    const endDate = addDays(startOfToday(), 1); // Inclui hoje

    const rec = receivables.filter(r => {
      const receiptDate = parseISO(r.receipt_date);
      return receiptDate >= startDate && receiptDate < endDate;
    });
    const pay = payables.filter(p => {
      const paymentDate = parseISO(p.payment_date);
      return paymentDate >= startDate && paymentDate < endDate;
    });
    return { filteredReceivables: rec, filteredPayables: pay };
  }, [receivables, payables, filter]);

  const kpiData = useMemo(() => {
    const totalReceived = filteredReceivables.reduce((sum, r) => sum + Number(r.net_value), 0);
    const totalPaid = filteredPayables.reduce((sum, p) => sum + Number(p.value), 0);
    const balance = totalReceived - totalPaid;
    return { totalReceived, totalPaid, balance };
  }, [filteredReceivables, filteredPayables]);

  const barChartData = useMemo(() => {
    const formatType = (filter === 'weekly' || filter === 'monthly') ? 'dd/MM' : 'MMM/yy';
    const locale = ptBR;

    const dataMap: Map<string, { name: string; Entradas: number; Saídas: number }> = new Map();

    filteredReceivables.forEach(r => {
      const name = format(parseISO(r.receipt_date), formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0 };
      entry.Entradas += Number(r.net_value);
      dataMap.set(name, entry);
    });

    filteredPayables.forEach(p => {
      const name = format(parseISO(p.payment_date), formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0 };
      entry.Saídas += Number(p.value);
      dataMap.set(name, entry);
    });

    // Idealmente, ordenar por data real antes de agrupar, mas para simplificar:
    return Array.from(dataMap.values());
  }, [filteredReceivables, filteredPayables, filter]);
  
  const pieChartData = useMemo(() => [
    { name: "Entradas", value: kpiData.totalReceived, fill: "hsl(var(--secondary))" },
    { name: "Saídas", value: kpiData.totalPaid, fill: "hsl(var(--destructive))" },
  ], [kpiData]);

  const topClients = useMemo(() => {
    const clientMap: Map<string, number> = new Map();
    filteredReceivables.forEach(r => {
      const name = r.client?.name || "Venda Avulsa";
      clientMap.set(name, (clientMap.get(name) || 0) + Number(r.net_value));
    });
    const sorted = Array.from(clientMap.entries()).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    return sorted.slice(0, 5).map(([name, value]) => ({ name, value, percentage: (value / max) * 100 }));
  }, [filteredReceivables]);

  const topSuppliers = useMemo(() => {
    const supplierMap: Map<string, number> = new Map();
    filteredPayables.forEach(p => {
      const name = p.supplier?.name || "Pagamento Avulso";
      supplierMap.set(name, (supplierMap.get(name) || 0) + Number(p.value));
    });
    const sorted = Array.from(supplierMap.entries()).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    return sorted.slice(0, 5).map(([name, value]) => ({ name, value, percentage: (value / max) * 100 }));
  }, [filteredPayables]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Componente customizado de tooltip para o gráfico de barras
  const CustomBarTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-xs shadow-lg shadow-[#F0E6D2]/40">
        <div className="font-medium">{label}</div>
        <div className="grid gap-1.5">
          {payload.map((item) => {
            const color = item.dataKey === "Entradas" 
              ? "hsl(var(--secondary))" 
              : "hsl(var(--destructive))";
            
            return (
              <div
                key={item.dataKey}
                className="flex w-full flex-wrap items-center gap-2 ml-2"
              >
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: color }}
                />
                <div className="flex flex-1 items-center gap-4">
                  <span className="text-muted-foreground min-w-[60px]">{item.name}</span>
                  <span className="font-sans font-medium tabular-nums text-foreground">
                    {formatCurrency(Number(item.value))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const exportToPDF = () => {
    toast.info("Export PDF será implementado em breve");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Relatórios
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Visão completa do fluxo financeiro.
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Select value={filter} onValueChange={(v) => setFilter(v as ReportsFilter)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar período..." />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg font-semibold tracking-wide text-muted-foreground">
                Total Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-3xl font-bold tabular-nums text-secondary">
                {formatCurrency(kpiData.totalReceived)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg font-semibold tracking-wide text-muted-foreground">
                Total Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-sans text-3xl font-bold tabular-nums text-destructive">
                {formatCurrency(kpiData.totalPaid)}
              </p>
            </CardContent>
          </Card>
          <Card className={kpiData.balance >= 0 ? "bg-secondary/5" : "bg-destructive/5"}>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg font-semibold tracking-wide text-muted-foreground">
                Saldo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-sans text-3xl font-bold tabular-nums ${kpiData.balance >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {formatCurrency(kpiData.balance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Principais */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Gráfico de Barras */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-2xl tracking-wide">Fluxo de Caixa no Período</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={(value) => `R$${value / 1000}k`} stroke="hsl(var(--muted-foreground))" />
                    <ChartTooltip content={<CustomBarTooltip />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="Entradas" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
          {/* Gráfico de Pizza */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl tracking-wide">Entradas e Saídas</CardTitle>
            </CardHeader>
            <CardContent className="relative h-[350px] w-full">
              {/* Texto Central Posicionado */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">

              </div>
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={80}
                      paddingAngle={5}
                      cornerRadius={5}
                    >
                      {pieChartData.map((entry, index) => (
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
            </CardContent>
          </Card>
        </div>

        {/* Listas Top 5 com Animação */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl tracking-wide">Receita por Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="popLayout">
                {topClients.length > 0 ? topClients.map((client) => (
                  <motion.div 
                    key={client.name} 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{client.name}</span>
                      <span className="font-sans font-medium tabular-nums text-secondary">{formatCurrency(client.value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-accent">
                      <motion.div 
                        className="h-2 rounded-full bg-secondary" 
                        initial={{ width: 0 }}
                        animate={{ width: `${client.percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )) : (
                  <p className="py-8 text-center text-muted-foreground">Nenhuma entrada no período.</p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl tracking-wide">Gastos por Fornecedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence mode="popLayout">
                {topSuppliers.length > 0 ? topSuppliers.map((supplier) => (
                  <motion.div 
                    key={supplier.name} 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{supplier.name}</span>
                      <span className="font-sans font-medium tabular-nums text-destructive">{formatCurrency(supplier.value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-accent">
                      <motion.div 
                        className="h-2 rounded-full bg-destructive" 
                        initial={{ width: 0 }}
                        animate={{ width: `${supplier.percentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )) : (
                  <p className="py-8 text-center text-muted-foreground">Nenhuma saída no período.</p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
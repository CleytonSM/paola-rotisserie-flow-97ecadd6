import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign } from "lucide-react";
import { getWeeklyBalance, getPendingCounts, getProfitHistory } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ balance: 0, totalReceivable: 0, totalPayable: 0 });
  const [pending, setPending] = useState({ pendingPayables: 0, pendingReceivables: 0 });
  const [profitData, setProfitData] = useState<any[]>([]);

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
    
    const [balanceResult, pendingResult, profitResult] = await Promise.all([
      getWeeklyBalance(),
      getPendingCounts(),
      getProfitHistory(),
    ]);

    if (balanceResult.error) {
      toast.error("Erro ao carregar saldo");
    } else if (balanceResult.data) {
      setBalance(balanceResult.data);
    }

    if (pendingResult.error) {
      toast.error("Erro ao carregar pendências");
    } else if (pendingResult.data) {
      setPending(pendingResult.data);
    }

    if (profitResult.error) {
      toast.error("Erro ao carregar histórico de lucros");
    } else if (profitResult.data) {
      setProfitData(profitResult.data);
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral financeira dos últimos 7 dias
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Saldo Semanal"
              value={formatCurrency(balance.balance)}
              icon={DollarSign}
              variant={balance.balance >= 0 ? "success" : "warning"}
              trend="Últimos 7 dias"
            />
            
            <StatsCard
              title="Total Recebido"
              value={formatCurrency(balance.totalReceivable)}
              icon={TrendingUp}
              variant="success"
              trend="Últimos 7 dias"
            />
            
            <StatsCard
              title="Total Pago"
              value={formatCurrency(balance.totalPayable)}
              icon={TrendingDown}
              trend="Últimos 7 dias"
            />
            
            <StatsCard
              title="Contas Pendentes"
              value={`${pending.pendingPayables + pending.pendingReceivables}`}
              icon={AlertCircle}
              variant="warning"
              trend={`${pending.pendingPayables} a pagar, ${pending.pendingReceivables} a receber`}
            />
          </div>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <h2 className="text-xl font-display font-semibold mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/receivable")}
                className="w-full p-4 text-left bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-lg transition-colors"
              >
                <p className="font-semibold text-secondary">Adicionar Entrada</p>
                <p className="text-sm text-muted-foreground">Registrar novo recebimento</p>
              </button>
              <button
                onClick={() => navigate("/payable")}
                className="w-full p-4 text-left bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
              >
                <p className="font-semibold text-foreground">Adicionar Saída</p>
                <p className="text-sm text-muted-foreground">Registrar novo pagamento</p>
              </button>
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <h2 className="text-xl font-display font-semibold mb-4">Resumo</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Status do Saldo</span>
                <span className={`font-semibold ${balance.balance >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {balance.balance >= 0 ? 'Positivo' : 'Negativo'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Pendências Totais</span>
                <span className="font-semibold">
                  {pending.pendingPayables + pending.pendingReceivables}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Período</span>
                <span className="font-semibold">Última semana</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lucros: Histórico e Projeção</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 bg-muted/50 animate-pulse rounded-lg" />
            ) : (
              <ChartContainer
                config={{
                  profit: {
                    label: "Lucro",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={formatMonthYear}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
                            <p className="font-semibold">{formatMonthYear(data.month)}</p>
                            <p className={`text-sm ${data.profit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                              {formatCurrency(data.profit)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {data.type === 'historical' ? 'Histórico' : 'Projeção'}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend 
                      formatter={(value, entry: any) => {
                        const type = entry.payload?.type;
                        return type === 'historical' ? 'Histórico' : 'Projeção';
                      }}
                    />
                    {profitData.filter(d => d.type === 'historical').length > 0 && (
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        data={profitData.filter(d => d.type === 'historical')}
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2, r: 4 }}
                        name="Histórico"
                      />
                    )}
                    {profitData.filter(d => d.type === 'projected').length > 0 && (
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        data={profitData.filter(d => d.type === 'projected')}
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: 'hsl(var(--secondary))', stroke: 'white', strokeWidth: 2, r: 4 }}
                        name="Projeção"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
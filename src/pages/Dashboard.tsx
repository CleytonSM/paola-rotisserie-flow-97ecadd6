import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Plus } from "lucide-react";
import {
  getWeeklyBalance,
  getUnpaidPayablesCount,
  getProfitHistory,
  getClientsCount,
  getSuppliersCount,
  getUpcomingPayablesCount,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"; // Removido ChartTooltipContent
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ balance: 0, totalReceivable: 0, totalPayable: 0 });
  const [unpaidPayablesCount, setUnpaidPayablesCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [upcomingPayablesCount, setUpcomingPayablesCount] = useState(0);
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

    const [
      balanceResult,
      unpaidPayablesResult,
      clientsResult,
      suppliersResult,
      upcomingPayablesResult,
      profitResult,
    ] = await Promise.all([
      getWeeklyBalance(),
      getUnpaidPayablesCount(),
      getClientsCount(),
      getSuppliersCount(),
      getUpcomingPayablesCount(),
      getProfitHistory(),
    ]);

    if (balanceResult.error) {
      toast.error("Erro ao carregar saldo");
    } else if (balanceResult.data) {
      setBalance(balanceResult.data);
    }

    if (unpaidPayablesResult.error) {
      toast.error("Erro ao carregar contas a pagar");
    } else if (unpaidPayablesResult.data !== null) {
      setUnpaidPayablesCount(unpaidPayablesResult.data);
    }

    if (clientsResult.error) {
      toast.error("Erro ao carregar total de clientes");
    } else if (clientsResult.data !== null) {
      setClientsCount(clientsResult.data);
    }

    if (suppliersResult.error) {
      toast.error("Erro ao carregar total de fornecedores");
    } else if (suppliersResult.data !== null) {
      setSuppliersCount(suppliersResult.data);
    }

    if (upcomingPayablesResult.error) {
      toast.error("Erro ao carregar contas a vencer");
    } else if (upcomingPayablesResult.data !== null) {
      setUpcomingPayablesCount(upcomingPayablesResult.data);
    }

    if (profitResult.error) {
      toast.error("Erro ao carregar histórico de lucros");
    } else if (profitResult.data) {
      setProfitData(profitResult.data);
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  };

  return (
    // Fundo #FFFBF5 aplicado globalmente
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          {/* ATUALIZADO: Título com Cormorant, responsivo e mais espaçado */}
          <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
            Dashboard
          </h1>
          {/* ATUALIZADO: Subtítulo com Satoshi e um pouco maior */}
          <p className="mt-2 text-lg text-muted-foreground">
            Visão geral financeira dos últimos 7 dias.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* ATUALIZADO: Skeletons com rounded-2xl para combinar com os cards */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          // ATUALIZADO: Grid responsiva
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              title="Contas a Pagar"
              value={`${unpaidPayablesCount}`}
              icon={AlertCircle}
              variant="warning"
              trend="Não pagas"
            />
          </div>
        )}

        {/* ATUALIZADO: Grid responsiva (1 col mobile, 2 desktop) */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-12 lg:grid-cols-2">
          {/* ATUALIZADO: Convertido para componente Card */}
          <Card className="flex h-full flex-col">
            <CardHeader>
              {/* ATUALIZADO: Título com Cormorant */}
              <CardTitle className="text-3xl">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4">
              {/* ATUALIZADO: Botão "Adicionar Entrada" (Secundário) */}
              <button
                onClick={() => navigate("/receivable")}
                className="group w-full rounded-xl border-2 border-secondary p-4 text-left transition-colors duration-300 hover:bg-secondary/10 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className="flex items-center space-x-3">
                  <Plus className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-semibold text-secondary">Adicionar Entrada</p>
                    <p className="text-sm text-muted-foreground">Registrar novo recebimento</p>
                  </div>
                </div>
              </button>
              {/* ATUALIZADO: Botão "Adicionar Saída" (Primário/Warning) */}
              <button
                onClick={() => navigate("/payable")}
                className="group w-full rounded-xl border-2 border-primary p-4 text-left transition-colors duration-300 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <div className="flex items-center space-x-3">
                  <TrendingDown className="h-5 w-5 text-primary-hover" />
                  <div>
                    <p className="font-semibold text-primary-hover">Adicionar Saída</p>
                    <p className="text-sm text-muted-foreground">Registrar novo pagamento</p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          {loading ? (
            // Skeleton para Resumo
            <Card className="flex h-full flex-col">
              <CardHeader>
                <div className="h-8 w-24 animate-pulse rounded bg-muted/50" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted/50" />
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
                    <div className="h-4 w-8 animate-pulse rounded bg-muted/50" />
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="h-4 w-36 animate-pulse rounded bg-muted/50" />
                    <div className="h-4 w-8 animate-pulse rounded bg-muted/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted/50" />
                    <div className="h-4 w-8 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // ATUALIZADO: Convertido para componente Card
            <Card className="flex h-full flex-col">
              <CardHeader>
                {/* ATUALIZADO: Título com Cormorant */}
                <CardTitle className="text-3xl">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm text-muted-foreground">Status do Saldo</span>
                    <span className={`font-semibold ${balance.balance >= 0 ? "text-secondary" : "text-destructive"}`}>
                      {balance.balance >= 0 ? "Positivo" : "Negativo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">Contas a Vencer em 7 dias</span>
                    <span className="font-sans font-semibold tabular-nums text-foreground">
                      {upcomingPayablesCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-sm text-muted-foreground">Total de Fornecedores</span>
                    <span className="font-sans font-semibold tabular-nums text-foreground">
                      {suppliersCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Clientes</span>
                    <span className="font-sans font-semibold tabular-nums text-foreground">
                      {clientsCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
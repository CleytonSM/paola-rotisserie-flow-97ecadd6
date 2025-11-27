import { StatsCard } from "@/components/StatsCard";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useDashboard } from "@/hooks/useDashboard";

export default function Dashboard() {

  const { 
    loading, 
    balance, 
    unpaidPayablesCount, 
    clientsCount,
    suppliersCount, 
    upcomingPayablesCount, 
    profitData, 
    overduePayablesCount, 
    formatCurrency, 
    formatMonthYear,
    navigate
  } = useDashboard();

  return (
    // Fundo #FFFBF5 aplicado globalmente
    <div className="flex min-h-screen flex-col">
      <main className="container flex-1 py-8 md:py-12">
        <PageHeader
          title="Dashboard"
          subtitle="Visão geral financeira dos últimos 7 dias."
          children={<AppBreadcrumb />}
        />

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* ATUALIZADO: Skeletons com rounded-2xl para combinar com os cards */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <>

            {/* ATUALIZADO: Grid responsiva */}
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

              {/* Combined card for Contas a Pagar and Contas Vencidas */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Contas a Pagar */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Contas a Pagar</span>
                    <span className="flex items-center gap-1.5 font-sans text-lg font-semibold text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      {unpaidPayablesCount}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Contas Vencidas */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Contas Vencidas</span>
                    <span className="flex items-center gap-1.5 font-sans text-lg font-semibold text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {overduePayablesCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
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
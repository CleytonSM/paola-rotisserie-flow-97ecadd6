import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { getAccountsReceivable, getAccountsPayable } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);

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
      setReceivables(recResult.data);
    }

    if (payResult.error) {
      toast.error("Erro ao carregar saídas");
    } else if (payResult.data) {
      setPayables(payResult.data);
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const exportToPDF = () => {
    // Placeholder para implementação futura com jsPDF
    toast.info("Export PDF será implementado em breve");
  };

  const totalReceived = receivables.reduce((sum, r) => sum + Number(r.net_value), 0);
  const totalPaid = payables.reduce((sum, p) => sum + Number(p.value), 0);
  const balance = totalReceived - totalPaid;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Visão completa do fluxo financeiro</p>
          </div>
          
          <Button onClick={exportToPDF} className="bg-primary hover:bg-primary-hover">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card className="border-secondary/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Recebido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-secondary">
                    {formatCurrency(totalReceived)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalPaid)}
                  </p>
                </CardContent>
              </Card>

              <Card className={balance >= 0 ? "border-secondary/20 bg-secondary/5" : "border-destructive/20 bg-destructive/5"}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${balance >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatCurrency(balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Últimas Entradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {receivables.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{rec.client?.name || "Venda avulsa"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(rec.receipt_date)}</p>
                        </div>
                        <p className="font-semibold text-secondary">{formatCurrency(rec.net_value)}</p>
                      </div>
                    ))}
                    {receivables.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma entrada registrada
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Últimas Saídas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payables.slice(0, 5).map((pay) => (
                      <div key={pay.id} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{pay.supplier?.name || "Sem fornecedor"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(pay.payment_date)}</p>
                        </div>
                        <p className="font-semibold text-destructive">{formatCurrency(pay.value)}</p>
                      </div>
                    ))}
                    {payables.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma saída registrada
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
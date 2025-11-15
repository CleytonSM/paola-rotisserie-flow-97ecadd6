import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KPIData } from "./types";
import { formatCurrency } from "./utils";

interface ReportsKPIsProps {
  kpiData: KPIData;
}

export function ReportsKPIs({ kpiData }: ReportsKPIsProps) {
  return (
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
          <p
            className={`font-sans text-3xl font-bold tabular-nums ${
              kpiData.balance >= 0 ? "text-secondary" : "text-destructive"
            }`}
          >
            {formatCurrency(kpiData.balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


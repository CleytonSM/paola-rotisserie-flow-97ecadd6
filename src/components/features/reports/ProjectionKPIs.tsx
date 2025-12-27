import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectionKPIs as ProjectionKPIsType } from "./types";
import { formatCurrency } from "@/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectionKPIsProps {
    data?: ProjectionKPIsType;
    loading: boolean;
    days: number;
}

export function ProjectionKPIs({ data, loading, days }: ProjectionKPIsProps) {
    if (loading || !data) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-[120px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[150px] mb-2" />
                            <Skeleton className="h-4 w-[100px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const kpis = [
        {
            title: "Total a Pagar",
            value: data.totalToPay,
            textColor: "text-destructive",
            overdue: data.payablesOverdue,
            details: [
                { label: "Vencidos", value: data.payablesOverdue, alert: true },
                { label: "Hoje", value: data.payablesToday },
                { label: `Próx. ${days} dias`, value: days === 7 ? data.payables7 : days === 15 ? data.payables15 : data.payables30 }
            ]
        },
        {
            title: "Total a Receber",
            value: data.totalToReceive,
            textColor: "text-secondary",
            overdue: data.receivablesOverdue,
            details: [
                { label: "Atrasados", value: data.receivablesOverdue, alert: true },
                { label: "Hoje", value: data.receivablesToday },
                { label: `Próx. ${days} dias`, value: days === 7 ? data.receivables7 : days === 15 ? data.receivables15 : data.receivables30 }
            ]
        },
        {
            title: "Saldo Estimado",
            value: data.estimatedBalance,
            textColor: data.estimatedBalance >= 0 ? "text-secondary" : "text-destructive",
            isBalance: true,
            description: "Considerando previsão de entradas e saídas."
        }
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {kpis.map((kpi, index) => (
                <Card key={index} className={`h-full flex flex-col ${kpi.isBalance ? (data.estimatedBalance >= 0 ? "bg-secondary/5" : "bg-destructive/5") : ""}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-display text-lg font-semibold tracking-wide text-muted-foreground flex items-center justify-between">
                            {kpi.title}
                            {kpi.overdue > 0 && !kpi.isBalance && (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Existem valores vencidos/atrasados inclusos.</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`font-sans text-3xl font-bold tabular-nums mb-4 ${kpi.textColor}`}>
                            {formatCurrency(kpi.value)}
                        </div>

                        {!kpi.isBalance ? (
                            <div className="space-y-1">
                                {kpi.details.map((detail, idx) => (
                                    <div key={idx} className={`flex justify-between text-sm ${detail.alert && detail.value > 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                        <span>{detail.label}</span>
                                        <span className="font-sans">{formatCurrency(detail.value)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col justify-end h-full">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-sm text-muted-foreground flex gap-2 items-center mt-auto cursor-help hover:text-foreground transition-colors">
                                            <Info className="h-4 w-4" />
                                            {kpi.description}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[200px]">
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between gap-4">
                                                <span>Saldo Atual:</span>
                                                <span className="font-mono">{formatCurrency(data.currentBalance)}</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-emerald-500">
                                                <span>+ A Receber:</span>
                                                <span className="font-mono">{formatCurrency(data.totalToReceive)}</span>
                                            </div>
                                            <div className="flex justify-between gap-4 text-red-500">
                                                <span>- A Pagar:</span>
                                                <span className="font-mono">{formatCurrency(data.totalToPay)}</span>
                                            </div>
                                            <div className="border-t pt-1 mt-1 font-bold flex justify-between gap-4">
                                                <span>= Final:</span>
                                                <span className="font-mono">{formatCurrency(data.estimatedBalance)}</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

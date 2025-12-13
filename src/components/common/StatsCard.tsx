import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning";
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    // ATUALIZADO: Cores mais sutis do novo tema "Claude"
    success: "border-secondary/20 bg-secondary/5",
    warning: "border-primary/20 bg-primary/5",
  };

  return (
    // ATUALIZADO:
    // - Card base já é rounded-2xl
    // - Adicionada transição de hover sutil (levantar e sombra)
    <Card
      className={cn(
        variantStyles[variant],
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-[#F0E6D2]/40",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* ATUALIZADO:
            - font-display (Cormorant) -> font-sans (Satoshi) para legibilidade dos NÚMEROS
            - text-2xl -> text-3xl para mais impacto
            - text-foreground para cor principal
        */}
        <div className="font-sans text-3xl font-bold text-foreground">{value}</div>
        {trend && (
          <p className="mt-1 text-xs text-muted-foreground">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
  variant = "default" 
}: StatsCardProps) => {
  const variantStyles = {
    default: "border-border",
    success: "border-secondary/20 bg-secondary/5",
    warning: "border-primary/20 bg-primary/5",
  };

  return (
    <Card className={`${variantStyles[variant]} shadow-sm hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
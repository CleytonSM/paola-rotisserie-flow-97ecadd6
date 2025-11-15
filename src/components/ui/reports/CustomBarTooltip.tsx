import type { TooltipProps } from "recharts";
import { formatCurrency } from "./utils";

export function CustomBarTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-xs shadow-lg shadow-[#F0E6D2]/40">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const color =
            item.dataKey === "Entradas"
              ? "hsl(var(--secondary))"
              : "hsl(var(--destructive))";

          return (
            <div
              key={item.dataKey}
              className="ml-2 flex w-full flex-wrap items-center gap-2"
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
              <div className="flex flex-1 items-center gap-4">
                <span className="min-w-[60px] text-muted-foreground">{item.name}</span>
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
}


import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Download } from "lucide-react";
import type { ReportsFilter } from "./types";

const filterOptions: { label: string; value: ReportsFilter }[] = [
  { label: "Hoje", value: "today" },
  { label: "Últimos 7 dias", value: "weekly" },
  { label: "Últimos 30 dias", value: "monthly" },
  { label: "Últimos 2 meses", value: "bimonthly" },
  { label: "Últimos 3 meses", value: "quarterly" },
  { label: "Últimos 6 meses", value: "semiannually" },
  { label: "Último ano", value: "annually" },
  { label: "Personalizado", value: "custom" },
];

interface ReportsFiltersProps {
  filter: ReportsFilter;
  onFilterChange: (filter: ReportsFilter) => void;
  customDateRange: DateRange | undefined;
  onCustomDateRangeChange: (range: DateRange | undefined) => void;
  onExport: () => void;
}

export function ReportsFilters({
  filter,
  onFilterChange,
  customDateRange,
  onCustomDateRangeChange,
  onExport,
}: ReportsFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-2 md:flex-row md:w-auto">
      <Select
        value={filter}
        onValueChange={(v) => {
          onFilterChange(v as ReportsFilter);
          if (v !== "custom") {
            onCustomDateRangeChange(undefined);
          }
        }}
      >
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="Filtrar período..." />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filter === "custom" && (
        <DateRangePicker
          date={customDateRange}
          setDate={onCustomDateRangeChange}
          className="w-full md:w-auto"
        />
      )}
      <Button onClick={onExport} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Exportar
      </Button>
    </div>
  );
}


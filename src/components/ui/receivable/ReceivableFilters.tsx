import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusFilter } from "./types";

interface ReceivableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function ReceivableFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
}: ReceivableFiltersProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      {/* Barra de Busca */}
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, CPF/CNPJ, valor..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {/* Filtros */}
      <div className="flex flex-nowrap gap-4 items-center">
        <DateRangePicker
          date={dateRange}
          setDate={onDateRangeChange}
          className="[&_button]:h-9 [&_button]:w-auto [&_button]:min-w-[200px] [&_button]:md:w-[260px]"
        />
        <Button
          variant={statusFilter === "all" ? "outline" : "ghost"}
          size="sm"
          onClick={() => onStatusFilterChange("all")}
          className={cn(statusFilter === "all" && "border-tertiary text-tertiary")}
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === "pending" ? "outline" : "ghost"}
          size="sm"
          onClick={() => onStatusFilterChange("pending")}
          className={cn(statusFilter === "pending" && "border-primary text-primary")}
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === "overdue" ? "outline" : "ghost"}
          size="sm"
          onClick={() => onStatusFilterChange("overdue")}
          className={cn(statusFilter === "overdue" && "border-destructive text-destructive")}
        >
          Vencidos
        </Button>
        <Button
          variant={statusFilter === "received" ? "outline" : "ghost"}
          size="sm"
          onClick={() => onStatusFilterChange("received")}
          className={cn(statusFilter === "received" && "border-secondary text-secondary")}
        >
          Recebidos
        </Button>
      </div>
    </div>
  );
}


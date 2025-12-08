import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusFilter } from "./types";

interface ReceivableFiltersProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function ReceivableFilters({
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
}: Omit<ReceivableFiltersProps, "searchTerm" | "onSearchChange">) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <DateRangePicker
        date={dateRange}
        setDate={onDateRangeChange}
        className="[&_button]:h-9 [&_button]:w-auto [&_button]:min-w-[200px]"
      />
      <div className="flex flex-wrap gap-2">
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


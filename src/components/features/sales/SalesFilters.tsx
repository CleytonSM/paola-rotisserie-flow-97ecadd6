import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface SalesFiltersProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
}

export function SalesFilters({
    dateRange,
    onDateRangeChange,
}: SalesFiltersProps) {
    return (
        <div className="flex flex-wrap gap-2 items-center">
            <DateRangePicker
                date={dateRange}
                setDate={onDateRangeChange}
                className="[&_button]:h-9 [&_button]:w-auto [&_button]:min-w-[200px]"
            />
        </div>
    );
}

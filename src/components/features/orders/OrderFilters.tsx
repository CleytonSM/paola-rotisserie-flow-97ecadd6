import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isSameDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, X } from "lucide-react";

interface OrderFiltersProps {
    dateFilter?: Date | { from: Date; to: Date };
    onDateChange: (date: Date | { from: Date; to: Date } | undefined) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export function OrderFilters({
    dateFilter,
    onDateChange,
    searchTerm,
    onSearchChange,
}: OrderFiltersProps) {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    const isToday = dateFilter instanceof Date && isSameDay(dateFilter, today);
    const isTomorrow = dateFilter instanceof Date && isSameDay(dateFilter, tomorrow);

    // Check if next 7 days logic
    const isNext7Days = dateFilter && !('getDate' in dateFilter) && 'from' in dateFilter
        && isSameDay(dateFilter.from, today)
        && isSameDay(dateFilter.to, addDays(today, 6));

    // Check if a custom date is selected (not today, not tomorrow, not next 7 days)
    const isCustomDate = dateFilter && !isToday && !isTomorrow && !isNext7Days;

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por número ou nome do cliente..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => onSearchChange('')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <Button
                    variant={isToday ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "h-10 whitespace-nowrap",
                        isToday && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => onDateChange(today)}
                >
                    Hoje
                </Button>
                <Button
                    variant={isTomorrow ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "h-10 whitespace-nowrap",
                        isTomorrow && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => onDateChange(tomorrow)}
                >
                    Amanhã
                </Button>
                <Button
                    variant={isNext7Days ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "h-10 whitespace-nowrap",
                        isNext7Days && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => onDateChange({ from: today, to: addDays(today, 6) })}
                >
                    Próximos 7 dias
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={isCustomDate ? "secondary" : "outline"}
                            className={cn(
                                "w-[180px] justify-start text-left font-normal",
                                !dateFilter && "text-muted-foreground",
                                isCustomDate && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                        >
                            <CalendarIcon className={cn("mr-2 h-4 w-4", isCustomDate && "text-primary")} />
                            {dateFilter && dateFilter instanceof Date ? (
                                format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                                "Filtrar por data"
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={dateFilter instanceof Date ? dateFilter : undefined}
                            onSelect={(date) => onDateChange(date)}
                            locale={ptBR}
                            initialFocus
                        />
                        {dateFilter && (
                            <div className="p-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => onDateChange(undefined)}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Limpar data
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, X } from "lucide-react";

interface OrderFiltersProps {
    dateFilter?: Date;
    onDateChange: (date: Date | undefined) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export function OrderFilters({
    dateFilter,
    onDateChange,
    searchTerm,
    onSearchChange,
}: OrderFiltersProps) {
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

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full sm:w-[200px] justify-start text-left font-normal",
                            !dateFilter && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? (
                            format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                            "Filtrar por data"
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="single"
                        selected={dateFilter}
                        onSelect={onDateChange}
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
    );
}


"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X, ChevronUp, ChevronDown, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showTime?: boolean;
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
  showTime = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (date && showTime) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
      }
      setDate(newDate);
      if (!showTime) {
        setOpen(false);
      }
    } else {
      setDate(undefined);
    }
  };

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    if (!date) return;
    const newDate = new Date(date);
    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) return;

    if (type === "hour") {
      if (numValue >= 0 && numValue < 24) {
        newDate.setHours(numValue);
        setDate(newDate);
      }
    } else {
      if (numValue >= 0 && numValue < 60) {
        newDate.setMinutes(numValue);
        setDate(newDate);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate(undefined);
  };

  const adjustTime = (type: "hour" | "minute", amount: number) => {
    if (!date) return;
    const newDate = new Date(date);
    if (type === "hour") {
      newDate.setHours(newDate.getHours() + amount);
    } else {
      newDate.setMinutes(newDate.getMinutes() + amount);
    }
    setDate(newDate);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal bg-input border-input relative pr-8", // Estilo "filled" + padding for X icon
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, showTime ? "PPP HH:mm" : "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
          {date && !disabled && (
            <X
              className="absolute right-2 h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus locale={ptBR} />
        {showTime && (
          <div className="border-t p-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 justify-center">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-medium">Horário</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => adjustTime("hour", 1)}
                    disabled={!date}
                    type="button"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className="h-8 w-12 rounded-md border border-input bg-background px-2 py-1 text-center text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={date ? format(date, "HH") : ""}
                    onChange={(e) => handleTimeChange("hour", e.target.value)}
                    disabled={!date}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => adjustTime("hour", -1)}
                    disabled={!date}
                    type="button"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <span className="text-muted-foreground font-medium pb-1">:</span>
                <div className="flex flex-col items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => adjustTime("minute", 1)}
                    disabled={!date}
                    type="button"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className="h-8 w-12 rounded-md border border-input bg-background px-2 py-1 text-center text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={date ? format(date, "mm") : ""}
                    onChange={(e) => handleTimeChange("minute", e.target.value)}
                    disabled={!date}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-muted"
                    onClick={() => adjustTime("minute", -1)}
                    disabled={!date}
                    type="button"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

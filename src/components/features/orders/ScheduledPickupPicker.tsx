import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { HourSelector } from "@/components/ui/hour-selector";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScheduledPickupPickerProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
}

export function ScheduledPickupPicker({ value, onChange }: ScheduledPickupPickerProps) {
    const [isScheduled, setIsScheduled] = useState(!!value);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(value || undefined);
    const [selectedTime, setSelectedTime] = useState<string>(
        value ? format(value, "HH:mm") : "12:00"
    );

    useEffect(() => {
        if (value) {
            setIsScheduled(true);
            setSelectedDate(value);
            setSelectedTime(format(value, "HH:mm"));
        }
    }, [value]);

    const handleScheduleToggle = (checked: boolean) => {
        setIsScheduled(checked);
        if (!checked) {
            setSelectedDate(undefined);
            setSelectedTime("12:00");
            onChange(null);
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(12, 0, 0, 0);
            setSelectedDate(tomorrow);
            setSelectedTime("12:00");
            onChange(tomorrow);
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        if (date) {
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours, minutes, 0, 0);
            onChange(newDate);
        }
    };

    const handleTimeChange = (time: string) => {
        setSelectedTime(time);
        if (selectedDate && time) {
            const [hours, minutes] = time.split(":").map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours, minutes, 0, 0);
            onChange(newDate);
        }
    };

    return (
        <Card className={cn(
            "transition-all",
            isScheduled && "border-primary/50 bg-primary/5"
        )}>
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="schedule-order"
                        checked={isScheduled}
                        onCheckedChange={handleScheduleToggle}
                    />
                    <Label
                        htmlFor="schedule-order"
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                        <CalendarClock className="w-4 h-4 text-primary" />
                        Agendar retirada
                    </Label>
                </div>

                {isScheduled && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                        <Popover open={isOpen} onOpenChange={setIsOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    {selectedDate ? (
                                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                        "Data"
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        handleDateSelect(date);
                                        setIsOpen(false);
                                    }}
                                    locale={ptBR}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <HourSelector
                            value={selectedTime}
                            onChange={handleTimeChange}
                            className="h-10"
                        />
                    </div>
                )}

                {isScheduled && value && (
                    <p className="text-xs text-muted-foreground">
                        Retirada: {format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


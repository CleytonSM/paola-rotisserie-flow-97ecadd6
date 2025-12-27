import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"

interface HourSelectorProps {
    value: string
    onChange: (value: string) => void
    className?: string
    disabled?: boolean
}

export function HourSelector({ value, onChange, className, disabled }: HourSelectorProps) {
    const [open, setOpen] = React.useState(false)

    // Handle initial/empty values
    const [hours, minutes] = value.split(":").map((v) => parseInt(v, 10))

    // Generate hours (0-23)
    const hoursList = Array.from({ length: 24 }, (_, i) => i)
    // Generate minutes (0-55, step 5)
    const minutesList = Array.from({ length: 12 }, (_, i) => i * 5)

    const hourInfo = React.useMemo(() => {
        return hoursList.find(h => h === hours) !== undefined ? hours : 0;
    }, [hours, hoursList]);

    const minuteInfo = React.useMemo(() => {
        // Find closest minute in our list or default to 0
        return minutesList.reduce((prev, curr) => Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev, 0);
    }, [minutes, minutesList]);

    const hourRef = useRef<HTMLButtonElement>(null)
    const minuteRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (open) {
            // Small delay to ensure popover content is rendered
            const timer = setTimeout(() => {
                hourRef.current?.scrollIntoView({ block: "center" })
                minuteRef.current?.scrollIntoView({ block: "center" })
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [open])

    const handleTimeChange = (type: "hour" | "minute", newVal: number) => {
        const currentHours = isNaN(hours) ? 0 : hours;
        const currentMinutes = isNaN(minutes) ? 0 : minutes;

        let newHours = currentHours;
        let newMinutes = currentMinutes;

        if (type === "hour") {
            newHours = newVal;
        } else {
            newMinutes = newVal;
            setOpen(false);
        }

        const formattedTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
        onChange(formattedTime);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal px-3",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value || "Selecione o horário"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-64 w-48 bg-background">
                    <ScrollArea className="h-full w-1/2 border-r" onWheel={(e) => e.stopPropagation()}>
                        <div className="flex flex-col p-2 gap-1">
                            <span className="text-xs font-medium text-center text-muted-foreground mb-2">Horas</span>
                            {hoursList.map((hour) => (
                                <Button
                                    key={hour}
                                    ref={hour === hourInfo ? hourRef : null}
                                    variant={hours === hour ? "default" : "ghost"}
                                    size="sm"
                                    className="w-full justify-center shrink-0"
                                    onClick={() => handleTimeChange("hour", hour)}
                                >
                                    {hour.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    <ScrollArea className="h-full w-1/2" onWheel={(e) => e.stopPropagation()}>
                        <div className="flex flex-col p-2 gap-1">
                            <span className="text-xs font-medium text-center text-muted-foreground mb-2">Minutos</span>
                            {minutesList.map((minute) => (
                                <Button
                                    key={minute}
                                    ref={minute === minuteInfo ? minuteRef : null}
                                    variant={minutes === minute ? "default" : "ghost"}
                                    size="sm"
                                    className="w-full justify-center shrink-0"
                                    onClick={() => handleTimeChange("minute", minute)}
                                >
                                    {minute.toString().padStart(2, "0")}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    )
}

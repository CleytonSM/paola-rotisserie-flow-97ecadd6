import * as React from "react";
import { cn } from "@/lib/utils";
import { toBrazilianFormat, toUSFormat } from "@/utils/format";

export interface MoneyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
    /**
     * The value in US format (period as decimal separator)
     * Can be a number or string
     */
    value: number | string;
    /**
     * Called with the value in US format (period as decimal separator)
     */
    onChange: (value: string) => void;
    /**
     * Number of decimal places to allow (default: 2)
     */
    decimalPlaces?: number;
}

/**
 * MoneyInput component that displays values in Brazilian format (comma as decimal)
 * while internally storing them in US format (period as decimal) for API compatibility.
 * 
 * Users can type with either comma or period - both are accepted.
 */
const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    ({ className, value, onChange, decimalPlaces = 2, ...props }, ref) => {
        // Use internal state to handle the display value
        const [internalValue, setInternalValue] = React.useState(() => {
            if (value === "" || value === null || value === undefined || value === 0) return "";
            return toBrazilianFormat(value);
        });

        // Sync internal state when external value changes (e.g., form reset or edit mode)
        React.useEffect(() => {
            if (value === "" || value === null || value === undefined) {
                setInternalValue("");
            } else if (value === 0) {
                // Don't overwrite if user is typing
                if (internalValue === "" || internalValue === "0") {
                    setInternalValue("");
                }
            } else {
                const newDisplayValue = toBrazilianFormat(value);
                // Only update if the underlying value is different (prevents cursor jump)
                const currentUSValue = toUSFormat(internalValue);
                if (currentUSValue !== String(value) && currentUSValue !== toUSFormat(String(value))) {
                    setInternalValue(newDisplayValue);
                }
            }
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;

            // Allow empty input
            if (inputValue === "") {
                setInternalValue("");
                onChange("");
                return;
            }

            // Convert to US format for validation
            const usFormatValue = toUSFormat(inputValue);

            // Limit decimal places if specified
            if (decimalPlaces !== undefined && usFormatValue.includes(".")) {
                const parts = usFormatValue.split(".");
                if (parts[1] && parts[1].length > decimalPlaces) {
                    // Don't update if exceeds decimal places
                    return;
                }
            }

            // Update internal value with Brazilian format (showing comma)
            setInternalValue(inputValue.replace(".", ","));

            // Call onChange with US format
            onChange(usFormatValue);
        };

        return (
            <input
                type="text"
                inputMode="decimal"
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    className
                )}
                ref={ref}
                value={internalValue}
                onChange={handleChange}
                {...props}
            />
        );
    }
);

MoneyInput.displayName = "MoneyInput";

export { MoneyInput };

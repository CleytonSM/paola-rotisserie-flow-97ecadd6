/**
 * Product utility functions
 */

/**
 * Format price for display
 */
export const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(numPrice);
};

/**
 * Format discount percentage for display
 */
export const formatDiscount = (discount: number | null | undefined): string => {
    if (!discount) return "0%";
    return `${(discount * 100).toFixed(0)}%`;
};

/**
 * Format shelf life days for display
 */
export const formatShelfLife = (days: number | null | undefined): string => {
    if (!days) return "-";
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
};

/**
 * Mask price input (allows decimals)
 */
export const maskPrice = (value: string): string => {
    // Remove non-numeric characters except decimal point
    let cleaned = value.replace(/[^\d.,]/g, "");

    // Replace comma with period for decimal
    cleaned = cleaned.replace(",", ".");

    // Ensure only one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    return cleaned;
};

/**
 * Mask discount input (0-100%)
 */
export const maskDiscount = (value: string): string => {
    // Remove non-numeric characters
    let cleaned = value.replace(/[^\d]/g, "");

    // Limit to 100
    let num = parseInt(cleaned || "0");
    if (num > 100) num = 100;

    return num.toString();
};

/**
 * Convert discount percentage to decimal (e.g., 10 -> 0.1)
 */
export const percentToDecimal = (percent: string | number): number => {
    const num = typeof percent === "string" ? parseFloat(percent) : percent;
    return num / 100;
};

/**
 * Convert decimal to percentage (e.g., 0.1 -> 10)
 */
export const decimalToPercent = (decimal: number | null | undefined): string => {
    if (!decimal) return "0";
    return (decimal * 100).toString();
};

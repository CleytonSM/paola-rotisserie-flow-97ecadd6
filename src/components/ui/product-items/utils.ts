/**
 * Product Items utility functions
 */

/**
 * Format weight for display
 */
export const formatWeight = (weight: number): string => {
    return `${weight.toFixed(3)} kg`;
};

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
    return `${(discount * 100).toFixed(1)}%`;
};

/**
 * Format datetime for display
 */
export const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/**
 * Calculate days until expiration
 */
export const getDaysUntilExpiration = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Format expiration with days remaining
 */
export const formatExpiration = (expiresAt: string): string => {
    const days = getDaysUntilExpiration(expiresAt);

    if (days < 0) {
        return `Vencido há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`;
    } else if (days === 0) {
        return "Vence hoje";
    } else if (days === 1) {
        return "Vence amanhã";
    } else {
        return `Vence em ${days} dias`;
    }
};

/**
 * Get expiration badge variant based on days remaining
 */
export const getExpirationVariant = (expiresAt: string): "default" | "secondary" | "destructive" | "outline" => {
    const days = getDaysUntilExpiration(expiresAt);

    if (days < 0) return "destructive";
    if (days <= 1) return "destructive";
    if (days <= 3) return "secondary";
    return "outline";
};


/**
 * Get status label in Portuguese
 */
export const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        available: "Disponível",
        sold: "Vendido",
        reserved: "Reservado",
        expired: "Vencido",
        discarded: "Descartado",
    };
    return labels[status] || status;
};

/**
 * Mask price input (allows decimals)
 */
export const maskPrice = (value: string): string => {
    let cleaned = value.replace(/[^\d.,]/g, "");
    cleaned = cleaned.replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
};

/**
 * Mask weight input (allows decimals, max 3 decimal places)
 */
export const maskWeight = (value: string): string => {
    let cleaned = value.replace(/[^\d.,]/g, "");
    cleaned = cleaned.replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts[1].substring(0, 3);
    } else if (parts.length === 2) {
        cleaned = parts[0] + "." + parts[1].substring(0, 3);
    }
    return cleaned;
};

/**
 * Mask discount input (0-100%)
 */
export const maskDiscount = (value: string): string => {
    let cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
        cleaned = parts[0] + "." + parts[1];
    }
    let num = parseFloat(cleaned || "0");
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
    return (decimal * 100).toFixed(1);
};

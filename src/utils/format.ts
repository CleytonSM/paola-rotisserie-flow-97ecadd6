export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString("pt-BR");
};

/**
 * Convert a number or US format string to Brazilian display format
 * e.g., 1.50 → "1,50"
 */
export const toBrazilianFormat = (value: number | string): string => {
  if (value === "" || value === null || value === undefined) return "";
  
  const numValue = typeof value === "string" ? value : value.toString();
  // Replace period with comma for display
  return numValue.replace(".", ",");
};

/**
 * Convert Brazilian input format to US format for API
 * e.g., "1,50" → "1.50"
 * Accepts both comma and period input
 */
export const toUSFormat = (value: string): string => {
  if (!value) return "";
  
  // Remove all non-numeric characters except comma and period
  let cleaned = value.replace(/[^\d.,]/g, "");
  
  // Replace comma with period
  cleaned = cleaned.replace(",", ".");
  
  // Handle multiple periods (keep only first)
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  
  return cleaned;
};

/**
 * Parse a Brazilian format string to a number
 * e.g., "1,50" → 1.5
 */
export const parseBrazilianNumber = (value: string): number => {
  const usFormat = toUSFormat(value);
  const parsed = parseFloat(usFormat);
  return isNaN(parsed) ? 0 : parsed;
};

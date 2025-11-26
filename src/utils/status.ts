import { BadgeProps } from "@/components/ui/badge";

/**
 * Returns the appropriate Badge variant for a given status.
 * Supports boolean (active/inactive) and string statuses (received, overdue, pending, etc).
 */
export const getStatusVariant = (status: string | boolean | undefined | null): BadgeProps["variant"] => {
  if (status === true) return "soft-secondary"; // Active
  if (status === false) return "soft-destructive"; // Inactive

  if (!status) return "soft-primary"; // Default/Unknown

  const normalizedStatus = status.toString().toLowerCase();

  switch (normalizedStatus) {
    case "received":
    case "paid":
    case "completed":
    case "available":
    case "active":
      return "soft-secondary";
    
    case "overdue":
    case "failed":
    case "cancelled":
    case "sold":
    case "discarded":
    case "expired":
    case "inactive":
      return "soft-destructive";
    
    case "pending":
    case "processing":
    default:
      return "soft-primary";
  }
};

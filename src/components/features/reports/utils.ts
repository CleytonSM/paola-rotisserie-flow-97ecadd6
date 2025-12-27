import { startOfToday, subDays, subMonths, subYears } from "date-fns";
import type { ReportsFilter } from "./types";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const getStartDateFromFilter = (filter: ReportsFilter) => {
  const today = startOfToday();
  switch (filter) {
    case "today":
      return today;
    case "weekly":
      return subDays(today, 7);
    case "monthly":
      return subDays(today, 30);
    case "bimonthly":
      return subMonths(today, 2);
    case "quarterly":
      return subMonths(today, 3);
    case "semiannually":
      return subMonths(today, 6);
    case "annually":
      return subYears(today, 1);
    default:
      return subDays(today, 30);
  }
};


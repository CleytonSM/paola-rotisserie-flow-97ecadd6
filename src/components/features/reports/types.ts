export type AccountReceivable = {
  id: string;
  net_value: number;
  entry_date: string | null;
  payment_date: string | null;
  created_at: string;
  client?: { name: string };
};

export type AccountPayable = {
  id: string;
  value: number;
  payment_date: string | null;
  due_date: string | null;
  created_at: string;
  supplier?: { name: string };
};

export type ReportsFilter =
  | "today"
  | "weekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannually"
  | "annually"
  | "custom";

export type KPIData = {
  totalReceived: number;
  totalPaid: number;
  balance: number;
};

export type BarChartData = {
  name: string;
  Entradas: number;
  Saídas: number;
};

export type PieChartData = {
  name: string;
  value: number;
  fill: string;
};

export type TopItem = {
  name: string;
  value: number;
  percentage: number;
  quantity?: number;
};

export type ProductReportItem = {
    id: string;
    name: string;
    quantity: number;
    totalValue: number;
};

export type HourlySalesData = {
    hour: number;
    value: number;
    count: number;
};

export type DailySalesData = {
    dayOfWeek: string;
    value: number;
    count: number;
};

export type PaymentMethodReport = {
    method: string;
    total: number;
    count: number;
    percentage: number;
};

export type SalesTypeReport = {
    type: string; // 'Balcão', 'Entrega', 'Agendado'
    total: number;
    count: number;
    percentage: number;
};

export type ProjectionKPIs = {
  currentBalance: number;
  totalToPay: number;
  totalToReceive: number;
  estimatedBalance: number;
  payablesOverdue: number;
  payablesToday: number;
  payables7: number;
  payables15: number;
  payables30: number;
  receivablesOverdue: number;
  receivablesToday: number;
  receivables7: number;
  receivables15: number;
  receivables30: number;
};

export type DailyProjection = {
  date: string;
  balance: number;
};

export type DetailedProjectionRow = {
  date: string;
  total: number;
  items: {
    origin: string;
    value: number;
  }[];
};


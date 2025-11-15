export type Supplier = {
  id: string;
  name: string;
};

export type AccountPayable = {
  id: string;
  supplier_id: string;
  value: number;
  payment_method: string;
  notes?: string;
  due_date?: string;
  payment_date?: string;
  status: "pending" | "paid";
  supplier?: Supplier;
};

export type FormData = {
  supplier_id: string;
  value: string;
  payment_method: string;
  notes: string;
  due_date: Date | undefined;
  payment_date: Date | undefined;
  status: string;
};

export type StatusFilter = "all" | "pending" | "paid" | "overdue";

export type AccountStatus = "paid" | "pending" | "overdue";


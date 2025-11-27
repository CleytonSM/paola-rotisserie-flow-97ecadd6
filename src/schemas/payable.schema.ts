import { z } from "zod";

export const payableSchema = z.object({
    supplier_id: z.string().min(1, "Selecione um fornecedor"),
    value: z.coerce.number().positive("Valor deve ser positivo"),
    payment_method: z.string().min(1, "Selecione um método de pagamento"),
    notes: z.string().optional(),
    due_date: z.date().optional(),
    payment_date: z.date().optional(),
    status: z.enum(["pending", "paid", "overdue"]).optional(),
});

export type PayableSchema = z.infer<typeof payableSchema>;

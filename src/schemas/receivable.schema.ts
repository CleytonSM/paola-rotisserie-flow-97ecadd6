import { z } from "zod";

export const receivableSchema = z.object({
    client_id: z.string().optional(),
    gross_value: z.coerce.number().positive("Valor deve ser positivo"),
    payment_method: z.string().min(1, "Selecione um método de pagamento"),
    card_brand: z.string().optional(),
    tax_rate: z.coerce.number().min(0, "Taxa deve ser positiva").max(100, "Taxa inválida").optional(),
    entry_date: z.date(),
});

export type ReceivableSchema = z.infer<typeof receivableSchema>;

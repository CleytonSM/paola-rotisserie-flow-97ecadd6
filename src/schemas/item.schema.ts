import { z } from "zod";

export const itemSchema = z.object({
    catalog_id: z.string().min(1, "Produto do catálogo é obrigatório"),
    scale_barcode: z.coerce.number().positive("Código de barras deve ser um número positivo"),
    weight_kg: z.coerce.number().positive("Peso deve ser maior que zero"),
    sale_price: z.coerce.number().positive("Preço de venda deve ser maior que zero"),
    item_discount: z.number().min(0).max(1).optional(),
    produced_at: z.string().optional(),
    status: z.enum(['available', 'sold', 'reserved', 'expired', 'discarded']).optional(),
});

export type ItemSchema = z.infer<typeof itemSchema>;

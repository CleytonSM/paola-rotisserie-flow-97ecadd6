import { z } from "zod";

/**
 * Zod validation schema for Product Catalog
 * Used for validating product data before creating or updating catalog items
 */
export const catalogSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
    base_price: z.number().positive("Preço base deve ser maior que zero"),
    // internal_code removed
    catalog_barcode: z.number().optional(),
    shelf_life_days: z.number().positive("Tempo de validade deve ser maior que zero").optional(),
    default_discount: z.number().min(0, "Desconto não pode ser negativo").max(1, "Desconto não pode ser maior que 100%").optional(),
    unit_type: z.enum(["kg", "un"]).default("kg"),
    is_internal: z.boolean().default(true),
    quantity: z.number().int("Quantidade deve ser um número inteiro").positive("Quantidade deve ser positiva").optional(),
    is_active: z.boolean().default(true),
    image_url: z.string().nullable().optional(),
});

/**
 * TypeScript type inferred from the catalogSchema
 */
export type CatalogSchemaType = z.infer<typeof catalogSchema>;

import { z } from "zod";

/**
 * Zod validation schema for Product Catalog
 * Used for validating product data before creating or updating catalog items
 */
export const catalogSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
    base_price: z.number().positive("Preço base deve ser maior que zero"),
    internal_code: z.string().max(50, "Código interno deve ter no máximo 50 caracteres").optional(),
    catalog_barcode: z.number().optional(),
    shelf_life_days: z.number().positive("Tempo de validade deve ser maior que zero"),
    default_discount: z.number().min(0, "Desconto não pode ser negativo").max(1, "Desconto não pode ser maior que 100%").optional(),
    unit_type: z.enum(["kg", "un"]).default("kg"),
    is_internal: z.boolean().default(true),
    is_active: z.boolean().default(true),
});

/**
 * TypeScript type inferred from the catalogSchema
 */
export type CatalogSchemaType = z.infer<typeof catalogSchema>;

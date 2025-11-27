import { validateCnpj } from "@/components/ui/suppliers/utils";
import z from "zod";

export const supplierSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    cnpj: z.string().optional().refine((val) => !val || validateCnpj(val), {
        message: "CNPJ inválido",
    }),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
});

export type SupplierSchema = z.infer<typeof supplierSchema>;

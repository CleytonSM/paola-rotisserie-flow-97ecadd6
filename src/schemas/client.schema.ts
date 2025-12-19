import { validateCpfCnpj } from "@/components/features/clients/utils";
import { z } from "zod";

export const clientSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    cpf_cnpj: z.string().optional().refine(validateCpfCnpj, {
        message: "CPF/CNPJ inválido",
    }),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    // Address fields (optional for creation)
    address_zip_code: z.string().optional(),
    address_street: z.string().optional(),
    address_number: z.string().optional(),
    address_neighborhood: z.string().optional(),
    address_city: z.string().optional(),
    address_state: z.string().optional(),
    address_complement: z.string().optional(),
});

export type ClientSchema = z.infer<typeof clientSchema>;
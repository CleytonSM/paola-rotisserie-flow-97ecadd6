import { validateCpfCnpj } from "@/components/ui/clients/utils";
import { z } from "zod";

export const clientSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    cpf_cnpj: z.string().optional().refine(validateCpfCnpj, {
        message: "CPF/CNPJ inválido",
    }),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
});

export type ClientSchema = z.infer<typeof clientSchema>;
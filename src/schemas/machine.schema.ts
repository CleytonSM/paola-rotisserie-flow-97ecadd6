import { z } from "zod";

export const flagSchema = z.object({
    id: z.string().optional(),
    brand: z.string().min(1, "Selecione a bandeira"),
    type: z.enum(["credit", "debit"]),
    tax_rate: z.coerce.number().min(0, "Taxa deve ser positiva").max(100, "Taxa inválida"),
});

export const machineSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    image: z.instanceof(File).optional(),
    flags: z.array(flagSchema).optional(),
});

export type FlagSchema = z.infer<typeof flagSchema>;
export type MachineSchema = z.infer<typeof machineSchema>;

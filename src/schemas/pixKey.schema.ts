import { z } from "zod";

export const pixKeySchema = z.object({
    type: z.enum(['aleatoria', 'telefone', 'cpf', 'cnpj', 'email']),
    key_value: z.string().min(1, "Chave é obrigatória"),
});

export type PixKeySchema = z.infer<typeof pixKeySchema>;

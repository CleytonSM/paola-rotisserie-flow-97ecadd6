import { z } from "zod";

export const authSchema = z.object({
    email: z.email("Email inválido").min(1, "Email é obrigatório"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
        .max(20, "Senha deve ter no máximo 20 caracteres"),
});

export type AuthFormData = z.infer<typeof authSchema>;

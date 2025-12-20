import { z } from "zod";

export const appSettingsSchema = z.object({
  store_cnpj: z.string().optional(),
  store_name: z.string().min(1, "Nome da loja é obrigatório"),
  store_address_street: z.string().min(1, "Rua é obrigatória"),
  store_address_number: z.string().min(1, "Número é obrigatório"),
  store_address_complement: z.string().optional(),
  store_address_neighborhood: z.string().min(1, "Bairro é obrigatório"),
  store_address_city: z.string().min(1, "Cidade é obrigatória"),
  store_address_state: z.string().length(2, "UF inválido"),
  store_address_zip_code: z.string().min(8, "CEP inválido").transform(val => val.replace(/\D/g, "")),
  fixed_delivery_fee: z.coerce.number().min(0, "Taxa deve ser zero ou positiva"),
});

export type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientSchema } from "@/schemas/client.schema";
import { useEffect } from "react";

interface UseClientFormProps {
    editingId: string | null;
    defaultValues?: Partial<ClientSchema>;
    onSuccess: (data: any) => Promise<boolean>;
}

export function useClientForm({ editingId, defaultValues, onSuccess }: UseClientFormProps) {
    const form = useForm<ClientSchema>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: "",
            cpf_cnpj: "",
            email: "",
            phone: "",
            ...defaultValues,
        },
    });

    // Reset form when editing changes
    useEffect(() => {
        if (defaultValues) {
            form.reset(defaultValues);
        } else {
            form.reset({
                name: "",
                cpf_cnpj: "",
                email: "",
                phone: "",
            });
        }
    }, [editingId, defaultValues, form]);

    const onSubmit = async (data: ClientSchema) => {
        // Clean masks before sending to API
        const cleanedData = {
            ...data,
            cpf_cnpj: data.cpf_cnpj ? data.cpf_cnpj.replace(/\D/g, "") : undefined,
            phone: data.phone ? data.phone.replace(/\D/g, "") : undefined,
            email: data.email || undefined,
        };

        const success = await onSuccess(cleanedData);
        if (success) {
            form.reset();
        }
    };

    return {
        form,
        onSubmit: form.handleSubmit(onSubmit),
    };
}

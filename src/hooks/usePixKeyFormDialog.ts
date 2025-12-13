import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createPixKey, PixKey, PixKeyType, updatePixKey } from "@/services/database";
import { PixKeySchema, pixKeySchema } from "@/schemas/pixKey.schema";

export const usePixKeyFormDialog = (
    pixKey: PixKey | null, 
    onSuccess: () => void, 
    onOpenChange: (open: boolean) => void
) => {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<PixKeySchema>({
        resolver: zodResolver(pixKeySchema),
        defaultValues: {
            type: 'cpf',
            key_value: "",
        },
    });

    const selectedType = form.watch("type");


    const onSubmit = async (values: PixKeySchema) => {
        setIsLoading(true);
        try {
            // Clean mask characters for specific types if needed, 
            // but usually for Pix keys we want to keep the format or clean it depending on the bank requirements.
            // Standard is usually clean numbers for CPF/CNPJ/Phone.
            let cleanValue = values.key_value;
            if (['cpf', 'cnpj', 'telefone'].includes(values.type)) {
                cleanValue = values.key_value.replace(/[^0-9+]/g, '');
            }

            if (pixKey) {
                await updatePixKey(pixKey.id, {
                    type: values.type,
                    key_value: cleanValue,
                });
                toast.success("Chave Pix atualizada!");
            } else {
                await createPixKey({
                    type: values.type,
                    key_value: cleanValue,
                    active: true,
                });
                toast.success("Chave Pix criada!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao salvar chave Pix");
        } finally {
            setIsLoading(false);
        }
    };

    const getMask = (type: PixKeyType) => {
        switch (type) {
            case 'cpf': return '000.000.000-00';
            case 'cnpj': return '00.000.000/0000-00';
            case 'telefone': return '+{55} (00) 00000-0000';
            default: return undefined;
        }
    };

    return {
        form,
        isLoading,
        onSubmit,
        getMask,
        selectedType,
    };
}
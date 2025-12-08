import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    PixKey,
    createPixKey,
    updatePixKey,
    PixKeyType,
} from "@/services/database";
import { GenericFormDialog } from "@/components/ui/generic-form-dialog";

const formSchema = z.object({
    type: z.enum(['aleatoria', 'telefone', 'cpf', 'cnpj', 'email']),
    key_value: z.string().min(1, "Chave é obrigatória"),
});

interface PixKeyFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pixKey?: PixKey | null;
    onSuccess: () => void;
}

export function PixKeyFormDialog({
    open,
    onOpenChange,
    pixKey,
    onSuccess,
}: PixKeyFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'cpf',
            key_value: "",
        },
    });

    const selectedType = form.watch("type");

    useEffect(() => {
        if (open) {
            if (pixKey) {
                form.reset({
                    type: pixKey.type,
                    key_value: pixKey.key_value,
                });
            } else {
                form.reset({
                    type: 'cpf',
                    key_value: "",
                });
            }
        }
    }, [pixKey, open]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
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
            console.error(error);
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

    return (
        <GenericFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={pixKey ? "Editar Chave Pix" : "Nova Chave Pix"}
            onSubmit={form.handleSubmit(onSubmit)}
            isEditing={!!pixKey}
            loading={isLoading}
            onCancel={() => onOpenChange(false)}
            maxWidth="max-w-md"
            triggerButton={
                <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Chave Pix
                </Button>
            }
        >
            <Form {...form}>
                <div className="space-y-6 w-full">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Chave</FormLabel>
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue('key_value', ''); // Reset value on type change
                                    }}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="cpf">CPF</SelectItem>
                                        <SelectItem value="cnpj">CNPJ</SelectItem>
                                        <SelectItem value="telefone">Telefone</SelectItem>
                                        <SelectItem value="email">E-mail</SelectItem>
                                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="key_value"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Chave</FormLabel>
                                <FormControl>
                                    {['cpf', 'cnpj', 'telefone'].includes(selectedType) ? (
                                        <IMaskInput
                                            mask={getMask(selectedType as PixKeyType)}
                                            value={field.value}
                                            unmask={false} // Keep mask for display, clean on submit
                                            onAccept={(value: any) => field.onChange(value)}
                                            placeholder={
                                                selectedType === 'cpf' ? '000.000.000-00' :
                                                    selectedType === 'cnpj' ? '00.000.000/0000-00' :
                                                        '+55 (00) 00000-0000'
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    ) : (
                                        <Input
                                            {...field}
                                            placeholder={selectedType === 'email' ? 'exemplo@email.com' : 'Chave aleatória'}
                                        />
                                    )}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </Form>
        </GenericFormDialog>
    );
}

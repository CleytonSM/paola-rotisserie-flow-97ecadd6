import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { MoneyInput } from "@/components/ui/common/money-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    CardMachine,
    createMachine,
    updateMachine,
    addFlag,
    deleteFlag,
} from "@/services/database";
import { machineSchema, type MachineSchema } from "@/schemas/machine.schema";
import { GenericFormDialog } from "@/components/ui/common/generic-form-dialog";

interface MachineFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machine?: CardMachine | null;
    onSuccess: () => void;
}

export function MachineFormDialog({
    open,
    onOpenChange,
    machine,
    onSuccess,
}: MachineFormDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const defaultValues: MachineSchema = {
        name: machine?.name || "",
        flags: machine?.flags?.map((f) => ({
            id: f.id,
            brand: f.brand,
            type: f.type as "credit" | "debit",
            tax_rate: f.tax_rate,
        })) || [],
    };

    const form = useForm<MachineSchema>({
        resolver: zodResolver(machineSchema),
        values: defaultValues,
        resetOptions: {
            keepDirtyValues: false,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "flags",
    });

    useEffect(() => {
        if (open) {
            form.reset(defaultValues);
            setPreviewUrl(machine?.image_url || null);
        } else {
            setPreviewUrl(null);
        }
    }, [open, machine, form]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue("image", file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const onSubmit = async (values: MachineSchema) => {
        setIsLoading(true);
        try {
            let machineId = machine?.id;

            // 1. Create or Update Machine
            if (machineId) {
                await updateMachine(machineId, {
                    name: values.name,
                    image: values.image,
                });
            } else {
                const { data: newMachine, error } = await createMachine({
                    name: values.name,
                    image: values.image,
                });
                if (error) throw error;
                if (!newMachine) throw new Error("Failed to create machine");
                machineId = newMachine.id;
            }

            // 2. Handle Flags
            if (values.flags && machineId) {
                const currentFlags = machine?.flags || [];

                // Identify flags to add (no ID)
                const flagsToAdd = values.flags.filter(f => !f.id);

                // Identify flags to delete (present in machine but not in form)
                const formFlagIds = values.flags.map(f => f.id).filter(Boolean);
                const flagsToDelete = currentFlags.filter(f => !formFlagIds.includes(f.id));

                // Execute additions
                for (const flag of flagsToAdd) {
                    await addFlag({
                        machine_id: machineId,
                        brand: flag.brand,
                        type: flag.type,
                        tax_rate: flag.tax_rate,
                    });
                }

                // Execute deletions
                for (const flag of flagsToDelete) {
                    await deleteFlag(flag.id);
                }
            }

            toast.success(machine ? "Maquininha atualizada!" : "Maquininha criada!");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erro ao salvar maquininha");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GenericFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={machine ? "Editar Maquininha" : "Adicionar Maquininha"}
            onSubmit={form.handleSubmit(onSubmit)}
            isEditing={!!machine}
            loading={isLoading}
            onCancel={() => onOpenChange(false)}
            triggerButton={
                <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Maquininha
                </Button>
            }
            maxWidth="max-w-4xl"
        >
            <Form {...form}>
                <div className="col-span-1 sm:col-span-2 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 w-full">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Máquina</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Moderninha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormItem>
                            <FormLabel>Imagem</FormLabel>
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-muted/50">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full"
                                />
                            </div>
                        </FormItem>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Bandeiras e Taxas</h4>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    append({ brand: "Visa", type: "credit", tax_rate: 0 })
                                }
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </Button>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bandeira</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Taxa (%)</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell className="p-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`flags.${index}.brand`}
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Visa">Visa</SelectItem>
                                                                <SelectItem value="Mastercard">Mastercard</SelectItem>
                                                                <SelectItem value="Elo">Elo</SelectItem>
                                                                <SelectItem value="Amex">Amex</SelectItem>
                                                                <SelectItem value="Hipercard">Hipercard</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`flags.${index}.type`}
                                                    render={({ field }) => (
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="credit">Crédito</SelectItem>
                                                                <SelectItem value="debit">Débito</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`flags.${index}.tax_rate`}
                                                    render={({ field }) => (
                                                        <MoneyInput
                                                            className="h-8"
                                                            placeholder="0,00"
                                                            value={field.value || ''}
                                                            onChange={(val) => field.onChange(parseFloat(val) || 0)}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {fields.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center text-muted-foreground text-sm py-4"
                                            >
                                                Nenhuma bandeira adicionada
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </Form>
        </GenericFormDialog>
    );
}

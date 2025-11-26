import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
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
import { DialogTrigger } from "@radix-ui/react-dialog";

const flagSchema = z.object({
    id: z.string().optional(),
    brand: z.string().min(1, "Selecione a bandeira"),
    type: z.enum(["credit", "debit"]),
    tax_rate: z.coerce.number().min(0, "Taxa deve ser positiva").max(100, "Taxa inválida"),
});

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    image: z.instanceof(File).optional(),
    flags: z.array(flagSchema).optional(),
});

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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            flags: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "flags",
    });

    useEffect(() => {
        if (open) {
            if (machine) {
                form.reset({
                    name: machine.name,
                    flags: machine.flags?.map((f) => ({
                        id: f.id,
                        brand: f.brand,
                        type: f.type,
                        tax_rate: f.tax_rate,
                    })) || [],
                });
                setPreviewUrl(machine.image_url || null);
            } else {
                form.reset({
                    name: "",
                    flags: [],
                });
                setPreviewUrl(null);
            }
        }
    }, [machine, open]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue("image", file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
            // For simplicity, we'll add new flags. 
            // Updating/Deleting existing flags in bulk is complex with the current service structure.
            // We will only add new flags from the list that don't have an ID.
            // And delete flags that were removed (if we tracked them).
            // BUT, to stick to the plan and prompt: "allow adding flags inline".
            // We will iterate over the flags in the form.

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
            console.error(error);
            toast.error("Erro ao salvar maquininha");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Maquininha
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {machine ? "Editar Maquininha" : "Adicionar Maquininha"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
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
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="h-8"
                                                                    {...field}
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

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Salvar
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

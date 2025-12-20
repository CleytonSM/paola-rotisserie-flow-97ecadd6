import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/useAppSettings";
import { AppSettingsFormValues, appSettingsSchema } from "@/schemas/settings.schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IMaskInput } from "react-imask";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { AppSettings } from "@/types/entities";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const { settings, isLoading, saveSettings, isSaving } = useAppSettings();
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    const form = useForm<AppSettingsFormValues>({
        resolver: zodResolver(appSettingsSchema),
        defaultValues: {
            store_cnpj: "",
            store_name: "",
            store_address_street: "",
            store_address_number: "",
            store_address_complement: "",
            store_address_neighborhood: "",
            store_address_city: "",
            store_address_state: "",
            store_address_zip_code: "",
            fixed_delivery_fee: 15.00,
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                store_cnpj: settings.store_cnpj || "",
                store_name: settings.store_name || "",
                store_address_street: settings.store_address_street || "",
                store_address_number: settings.store_address_number || "",
                store_address_complement: settings.store_address_complement || "",
                store_address_neighborhood: settings.store_address_neighborhood || "",
                store_address_city: settings.store_address_city || "",
                store_address_state: settings.store_address_state || "",
                store_address_zip_code: settings.store_address_zip_code || "",
                fixed_delivery_fee: settings.fixed_delivery_fee ?? 15.00,
            });
        }
    }, [settings, form]);

    const handleCepSearch = async () => {
        const cep = form.getValues("store_address_zip_code")?.replace(/\D/g, "");
        if (!cep || cep.length !== 8) {
            toast.error("CEP inválido");
            return;
        }

        setIsSearchingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error("CEP não encontrado");
                return;
            }

            form.setValue("store_address_street", data.logradouro);
            form.setValue("store_address_neighborhood", data.bairro);
            form.setValue("store_address_city", data.localidade);
            form.setValue("store_address_state", data.uf);
            toast.success("Endereço encontrado!");
            form.setFocus("store_address_number");
        } catch (error) {
            toast.error("Erro ao buscar CEP");
        } finally {
            setIsSearchingCep(false);
        }
    };

    const onSubmit = async (data: AppSettingsFormValues) => {
        await saveSettings(data as unknown as Partial<AppSettings>);
    };

    if (isLoading) {
        return (
            <Scaffolding>
                <PageHeader
                    title="Configurações Gerais"
                    subtitle="Gerencie as configurações da sua loja"
                    children={<AppBreadcrumb />}
                />
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-72" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-4">
                                <Skeleton className="h-10 w-full col-span-1" />
                                <Skeleton className="h-10 w-full md:col-span-3" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Scaffolding>
        );
    }

    return (
        <Scaffolding>
            <PageHeader
                title="Configurações Gerais"
                subtitle="Gerencie as configurações da sua loja"
                children={<AppBreadcrumb />}
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500">

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Loja</CardTitle>
                            <CardDescription>Informações básicas do estabelecimento</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="store_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Loja</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Paola Gonçalves Rotisseria" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="store_cnpj"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNPJ</FormLabel>
                                        <FormControl>
                                            <IMaskInput
                                                mask="00.000.000/0000-00"
                                                value={field.value}
                                                unmask={false}
                                                onAccept={(value) => field.onChange(value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="00.000.000/0000-00"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Endereço e Entrega</CardTitle>
                            <CardDescription>Configure o endereço da loja e taxas de entrega</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="grid gap-6 md:grid-cols-4">
                                <FormField
                                    control={form.control}
                                    name="store_address_zip_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CEP</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <IMaskInput
                                                        mask="00000-000"
                                                        value={field.value}
                                                        unmask={false}
                                                        onAccept={(value) => field.onChange(value)}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="00000-000"
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="secondary"
                                                    onClick={handleCepSearch}
                                                    disabled={isSearchingCep}
                                                >
                                                    {isSearchingCep ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Search className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="store_address_street"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rua</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="store_address_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="store_address_complement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Complemento</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="store_address_neighborhood"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bairro</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="md:col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="store_address_city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cidade</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="store_address_state"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>UF</FormLabel>
                                            <FormControl>
                                                <Input {...field} maxLength={2} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <div className="max-w-xs">
                                <FormField
                                    control={form.control}
                                    name="fixed_delivery_fee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Taxa de Entrega Fixa (R$)</FormLabel>
                                            <FormControl>
                                                <IMaskInput
                                                    mask={Number}
                                                    {...({
                                                        scale: 2,
                                                        signed: false,
                                                        thousandsSeparator: ".",
                                                        padFractionalZeros: true,
                                                        normalizeZeros: true,
                                                        radix: ",",
                                                        mapToRadix: ['.'],
                                                    } as any)}
                                                    value={field.value?.toString()} // Ensure value is string for mask
                                                    unmask={true}
                                                    onAccept={(value, mask) => {
                                                        // Pass the raw number back to the form
                                                        field.onChange(mask.typedValue);
                                                    }}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="0,00"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" size="lg" disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-5 w-5" />
                        )}
                        Salvar Configurações
                    </Button>
                </form>
            </Form>
        </Scaffolding>
    );
}

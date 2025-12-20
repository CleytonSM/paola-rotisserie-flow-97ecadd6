import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ClientSchema } from "@/schemas/client.schema";
import { applyCpfCnpjMask, applyPhoneMask } from "./utils";
import { GenericFormDialog } from "@/components/ui/common/generic-form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { toast } from "sonner";
import { applyCepMask } from "@/lib/masks";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ClientSchema>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  editingId: string | null;
  loading?: boolean;
  showTrigger?: boolean;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  editingId,
  loading = false,
  showTrigger = true,
}: ClientFormDialogProps) {
  const { register, formState: { errors }, setValue, watch } = form;

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const maskedValue = applyCpfCnpjMask(value);
    setValue("cpf_cnpj", maskedValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const maskedValue = applyPhoneMask(value);
    setValue("phone", maskedValue);
  };

  const [showAddress, setShowAddress] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const handleCepSearch = async () => {
    const cep = watch("address_zip_code")?.replace(/\D/g, "");
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

      setValue("address_street", data.logradouro);
      setValue("address_neighborhood", data.bairro);
      setValue("address_city", data.localidade);
      setValue("address_state", data.uf);
      form.setFocus("address_number");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <GenericFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingId ? "Editar Cliente" : "Adicionar Cliente"}
      onSubmit={onSubmit}
      isEditing={!!editingId}
      loading={loading}
      showTrigger={showTrigger}
      triggerButton={
        <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      }
    >
      <div className="space-y-2 sm:col-span-2">
        <Label>Nome</Label>
        <Input
          {...register("name")}
          placeholder="Nome do cliente"
        />
        {errors.name && (
          <span className="text-xs text-destructive">{errors.name.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>CPF/CNPJ</Label>
        <Input
          {...register("cpf_cnpj")}
          onChange={handleCpfCnpjChange}
          value={watch("cpf_cnpj") || ""}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
          maxLength={18}
        />
        {errors.cpf_cnpj && (
          <span className="text-xs text-destructive">{errors.cpf_cnpj.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          {...register("phone")}
          onChange={handlePhoneChange}
          value={watch("phone") || ""}
          placeholder="(00) 90000-0000"
          maxLength={15}
        />
        {errors.phone && (
          <span className="text-xs text-destructive">{errors.phone.message}</span>
        )}
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Email</Label>
        <Input
          type="email"
          {...register("email")}
          placeholder="contato@cliente.com"
        />
        {errors.email && (
          <span className="text-xs text-destructive">{errors.email.message}</span>
        )}
      </div>

      {!editingId && (
        <div className="sm:col-span-2 space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="add-address"
              checked={showAddress}
              onCheckedChange={(checked) => setShowAddress(checked as boolean)}
            />
            <Label htmlFor="add-address" className="cursor-pointer">Adicionar endereço agora?</Label>
          </div>

          {showAddress && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <Input
                    {...register("address_zip_code")}
                    onChange={(e) => {
                      e.target.value = applyCepMask(e.target.value);
                      form.setValue("address_zip_code", e.target.value);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleCepSearch} disabled={isSearchingCep}>
                    {isSearchingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input {...register("address_number")} placeholder="123" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Rua</Label>
                <Input {...register("address_street")} placeholder="Rua das Flores" />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input {...register("address_neighborhood")} placeholder="Centro" />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input {...register("address_complement")} placeholder="Apto 101" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input {...register("address_city")} placeholder="Cidade" />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input {...register("address_state")} placeholder="UF" maxLength={2} />
              </div>
            </div>
          )}
        </div>
      )}
    </GenericFormDialog>
  );
}


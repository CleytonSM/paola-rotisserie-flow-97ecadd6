import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ClientSchema } from "@/schemas/client.schema";
import { applyCpfCnpjMask, applyPhoneMask } from "./utils";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ClientSchema>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  editingId: string | null;
  loading?: boolean;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  form,
  onSubmit,
  editingId,
  loading = false,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide">
            {editingId ? "Editar Cliente" : "Adicionar Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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
          <Button type="submit" className="w-full sm:col-span-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingId ? "Salvando..." : "Adicionando..."}
              </>
            ) : (
              editingId ? "Salvar Alterações" : "Adicionar Cliente"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


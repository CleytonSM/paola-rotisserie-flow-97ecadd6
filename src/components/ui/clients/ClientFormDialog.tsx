import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import type { FormData } from "./types";
import { applyCpfCnpjMask, applyPhoneMask, maskCpfCnpj, maskPhone } from "./utils";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading?: boolean;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingId,
  onSubmit,
  onReset,
  loading = false,
}: ClientFormDialogProps) {
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const maskedValue = applyCpfCnpjMask(value);
    setFormData((prev) => ({ ...prev, cpf_cnpj: maskedValue }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const maskedValue = applyPhoneMask(value);
    setFormData((prev) => ({ ...prev, phone: maskedValue }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          onReset();
        }
      }}
    >
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do cliente"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>CPF/CNPJ</Label>
            <Input
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleCpfCnpjChange}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(00) 90000-0000"
              maxLength={15}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@cliente.com"
            />
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


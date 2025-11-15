import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import type { FormData } from "./types";
import { maskCnpj, maskPhone } from "./utils";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading?: boolean;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingId,
  onSubmit,
  onReset,
  loading = false,
}: SupplierFormDialogProps) {
  const handleMaskedInputChange = (e: React.ChangeEvent<HTMLInputElement>, mask: (value: string) => string) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: mask(value),
    }));
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
          Novo Fornecedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide">
            {editingId ? "Editar Fornecedor" : "Adicionar Fornecedor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do fornecedor"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input
              name="cnpj"
              value={formData.cnpj}
              onChange={(e) => handleMaskedInputChange(e, maskCnpj)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={(e) => handleMaskedInputChange(e, maskPhone)}
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
              placeholder="contato@fornecedor.com"
            />
          </div>
          <Button type="submit" className="w-full sm:col-span-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingId ? "Salvando..." : "Adicionando..."}
              </>
            ) : (
              editingId ? "Salvar Alterações" : "Adicionar Fornecedor"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


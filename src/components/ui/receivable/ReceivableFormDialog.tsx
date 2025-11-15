import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { Plus } from "lucide-react";
import type { Client, FormData } from "./types";
import { maskCpfCnpj } from "./utils";

interface ReceivableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  clients: Client[];
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function ReceivableFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  clients,
  editingId,
  onSubmit,
  onReset,
}: ReceivableFormDialogProps) {
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
        <Button className="bg-secondary text-secondary-foreground shadow-md transition-transform duration-300 ease-out hover:scale-105 hover:bg-secondary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide">
            {editingId ? "Editar Entrada" : "Adicionar Entrada"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Cliente (Opcional)</Label>
            <Combobox
              options={clients.map((c) => ({
                value: c.id,
                label: c.cpf_cnpj ? `${c.name} - ${maskCpfCnpj(c.cpf_cnpj)}` : c.name,
              }))}
              value={formData.client_id}
              onValueChange={(v) => setFormData({ ...formData, client_id: v })}
              placeholder="Venda avulsa (sem cliente)"
              searchPlaceholder="Buscar cliente..."
              emptyText="Nenhum cliente encontrado."
            />
          </div>
          <div className="space-y-2">
            <Label>Valor Bruto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.gross_value}
              onChange={(e) => setFormData({ ...formData, gross_value: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Entrada *</Label>
            <DatePicker
              date={formData.entry_date}
              setDate={(date) => setFormData({ ...formData, entry_date: date })}
              placeholder="Selecione uma data"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Método de Pagamento</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.payment_method === "card" && (
            <>
              <div className="space-y-2">
                <Label>Bandeira do Cartão</Label>
                <Input
                  value={formData.card_brand}
                  onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                  placeholder="Ex: Visa, Master"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  placeholder="Ex: 2.5"
                />
              </div>
            </>
          )}
          <Button
            type="submit"
            className="w-full sm:col-span-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {editingId ? "Salvar Alterações" : "Adicionar Entrada"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


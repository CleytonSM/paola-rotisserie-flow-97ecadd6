import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Loader2 } from "lucide-react";
import type { Supplier, FormData } from "./types";

interface PayableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  suppliers: Supplier[];
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading?: boolean;
}

export function PayableFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  suppliers,
  editingId,
  onSubmit,
  onReset,
  loading = false,
}: PayableFormDialogProps) {
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
          Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide">
            {editingId ? "Editar Conta" : "Adicionar Conta"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Fornecedor</Label>
            <Combobox
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
              value={formData.supplier_id}
              onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
              placeholder="Selecione um fornecedor..."
              searchPlaceholder="Buscar fornecedor..."
              emptyText="Nenhum fornecedor encontrado."
            />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
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
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <DatePicker
              date={formData.due_date}
              setDate={(date) => setFormData({ ...formData, due_date: date })}
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Pagamento</Label>
            <DatePicker
              date={formData.payment_date}
              setDate={(date) => setFormData({ ...formData, payment_date: date })}
              disabled={formData.status !== "paid"}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => {
                const newStatus = v;
                // Se mudou para "paid" e não tem payment_date, define como hoje
                const newPaymentDate = newStatus === "paid" && !formData.payment_date ? new Date() : formData.payment_date;
                // Se mudou para "pending", limpa payment_date
                const finalPaymentDate = newStatus === "pending" ? undefined : newPaymentDate;
                setFormData({ ...formData, status: newStatus, payment_date: finalPaymentDate });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observações</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Compra semanal de material..."
            />
          </div>
          <Button type="submit" className="w-full sm:col-span-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingId ? "Salvando..." : "Adicionando..."}
              </>
            ) : (
              editingId ? "Salvar Alterações" : "Adicionar Conta"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


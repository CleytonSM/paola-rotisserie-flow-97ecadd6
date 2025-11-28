import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { Plus } from "lucide-react";
import type { Supplier } from "./types";
import type { UseFormReturn } from "react-hook-form";
import type { PayableSchema } from "@/schemas/payable.schema";
import { GenericFormDialog } from "@/components/ui/generic-form-dialog";

interface PayableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<PayableSchema>;
  suppliers: Supplier[];
  editingId: string | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function PayableFormDialog({
  open,
  onOpenChange,
  form,
  suppliers,
  editingId,
  onSubmit,
}: PayableFormDialogProps) {
  const { register, watch, setValue, formState: { errors, isSubmitting } } = form;
  const status = watch("status");

  return (
    <GenericFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingId ? "Editar Conta" : "Adicionar Conta"}
      onSubmit={onSubmit}
      isEditing={!!editingId}
      loading={isSubmitting}
      triggerButton={
        <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      }
    >
      <div className="space-y-2 sm:col-span-2">
        <Label>Fornecedor</Label>
        <Combobox
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          value={watch("supplier_id")}
          onValueChange={(v) => setValue("supplier_id", v)}
          placeholder="Selecione um fornecedor..."
          searchPlaceholder="Buscar fornecedor..."
          emptyText="Nenhum fornecedor encontrado."
        />
        {errors.supplier_id && (
          <span className="text-xs text-destructive">{errors.supplier_id.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>Valor (R$)</Label>
        <Input
          type="number"
          step="0.01"
          {...register("value", { valueAsNumber: true })}
        />
        {errors.value && (
          <span className="text-xs text-destructive">{errors.value.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>Método de Pagamento</Label>
        <Select
          value={watch("payment_method")}
          onValueChange={(v) => setValue("payment_method", v)}
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
        {errors.payment_method && (
          <span className="text-xs text-destructive">{errors.payment_method.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>Data de Vencimento</Label>
        <DatePicker
          date={watch("due_date")}
          setDate={(date) => setValue("due_date", date)}
        />
      </div>
      <div className="space-y-2">
        <Label>Data de Pagamento</Label>
        <DatePicker
          date={watch("payment_date")}
          setDate={(date) => setValue("payment_date", date)}
          disabled={status !== "paid"}
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={watch("status")}
          onValueChange={(v) => {
            const newStatus = v as "pending" | "paid" | "overdue";
            setValue("status", newStatus);
            // Se mudou para "paid" e não tem payment_date, define como hoje
            if (newStatus === "paid" && !watch("payment_date")) {
              setValue("payment_date", new Date());
            }
            // Se mudou para "pending", limpa payment_date
            if (newStatus === "pending") {
              setValue("payment_date", undefined);
            }
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
          {...register("notes")}
          placeholder="Ex: Compra semanal de material..."
        />
      </div>
    </GenericFormDialog>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { maskCnpj, maskPhone } from "./utils";
import type { UseFormReturn } from "react-hook-form";
import type { SupplierSchema } from "@/schemas/suppliers.schema";
import { GenericFormDialog } from "@/components/common/generic-form-dialog";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<SupplierSchema>;
  editingId: string | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  form,
  editingId,
  onSubmit,
}: SupplierFormDialogProps) {
  const { register, watch, setValue, formState: { errors, isSubmitting } } = form;

  const handleMaskedChange = (field: "cnpj" | "phone", value: string, mask: (val: string) => string) => {
    setValue(field, mask(value));
  };

  return (
    <GenericFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingId ? "Editar Fornecedor" : "Adicionar Fornecedor"}
      onSubmit={onSubmit}
      isEditing={!!editingId}
      loading={isSubmitting}
      triggerButton={
        <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      }
    >
      <div className="space-y-2 sm:col-span-2">
        <Label>Nome</Label>
        <Input
          {...register("name")}
          placeholder="Nome do fornecedor"
        />
        {errors.name && (
          <span className="text-xs text-destructive">{errors.name.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>CNPJ</Label>
        <Input
          value={watch("cnpj") || ""}
          onChange={(e) => handleMaskedChange("cnpj", e.target.value, maskCnpj)}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        {errors.cnpj && (
          <span className="text-xs text-destructive">{errors.cnpj.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          value={watch("phone") || ""}
          onChange={(e) => handleMaskedChange("phone", e.target.value, maskPhone)}
          placeholder="(00) 90000-0000"
          maxLength={15}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Email</Label>
        <Input
          type="email"
          {...register("email")}
          placeholder="contato@fornecedor.com"
        />
        {errors.email && (
          <span className="text-xs text-destructive">{errors.email.message}</span>
        )}
      </div>
    </GenericFormDialog>
  );
}

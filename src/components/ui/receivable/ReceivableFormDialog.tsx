import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { Plus } from "lucide-react";
import type { Client } from "./types";
import { maskCpfCnpj } from "./utils";
import { useQuery } from "@tanstack/react-query";
import { getMachines, getPixKeys } from "@/services/database";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { UseFormReturn } from "react-hook-form";
import type { ReceivableSchema } from "@/schemas/receivable.schema";
import { GenericFormDialog } from "@/components/ui/generic-form-dialog";

interface ReceivableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ReceivableSchema>;
  clients: Client[];
  editingId: string | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function ReceivableFormDialog({
  open,
  onOpenChange,
  form,
  clients,
  editingId,
  onSubmit,
}: ReceivableFormDialogProps) {
  const { register, watch, setValue, formState: { errors, isSubmitting } } = form;
  const paymentMethod = watch("payment_method");
  const grossValue = watch("gross_value");

  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string>("");

  const { data: machines } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data, error } = await getMachines();
      if (error) throw error;
      return data;
    },
  });

  const { data: pixKeys } = useQuery({
    queryKey: ["pixKeys", "active"],
    queryFn: async () => {
      const { data, error } = await getPixKeys({ activeOnly: true });
      if (error) throw error;
      return data;
    },
    enabled: paymentMethod === "pix",
  });

  useEffect(() => {
    if (!open) {
      setSelectedMachineId("");
      setSelectedPixKeyId("");
    }
  }, [open]);

  const handleFlagSelect = (flagId: string) => {
    if (!machines) return;
    const machine = machines.find(m => m.id === selectedMachineId);
    const flag = machine?.flags?.find(f => f.id === flagId);

    if (flag) {
      setValue("card_brand", `${flag.brand} (${flag.type === 'credit' ? 'Crédito' : 'Débito'})`);
      setValue("tax_rate", flag.tax_rate);
    }
  };

  const handlePixKeySelect = (keyId: string) => {
    setSelectedPixKeyId(keyId);
    setValue("tax_rate", 0);
    setValue("card_brand", "PIX");
  };

  const getQrCodeValue = () => {
    if (!pixKeys || !selectedPixKeyId || !grossValue) return "";
    const key = pixKeys.find(k => k.id === selectedPixKeyId);
    if (!key) return "";
    return key.key_value;
  };

  return (
    <GenericFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingId ? "Editar Entrada" : "Adicionar Entrada"}
      onSubmit={onSubmit}
      isEditing={!!editingId}
      loading={isSubmitting}
      triggerButton={
        <Button className="bg-secondary text-secondary-foreground shadow-md transition-transform duration-300 ease-out hover:scale-105 hover:bg-secondary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      }
    >
      <div className="space-y-2 sm:col-span-2">
        <Label>Cliente (Opcional)</Label>
        <Combobox
          options={clients.map((c) => ({
            value: c.id,
            label: c.cpf_cnpj ? `${c.name} - ${maskCpfCnpj(c.cpf_cnpj)}` : c.name,
          }))}
          value={watch("client_id") || ""}
          onValueChange={(v) => setValue("client_id", v)}
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
          {...register("gross_value", { valueAsNumber: true })}
        />
        {errors.gross_value && (
          <span className="text-xs text-destructive">{errors.gross_value.message}</span>
        )}
      </div>
      <div className="space-y-2">
        <Label>Data de Entrada *</Label>
        <DatePicker
          date={watch("entry_date")}
          setDate={(date) => setValue("entry_date", date || new Date())}
          placeholder="Selecione uma data"
        />
        {errors.entry_date && (
          <span className="text-xs text-destructive">{errors.entry_date.message}</span>
        )}
      </div>
      <div className="space-y-2 sm:col-span-2">
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
            <SelectItem value="card">Cartão</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentMethod === "pix" && (
        <div className="sm:col-span-2 space-y-4 border rounded-lg p-4 bg-muted/20">
          <div className="space-y-2">
            <Label>Selecione a Chave Pix</Label>
            <Select
              value={selectedPixKeyId}
              onValueChange={handlePixKeySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma chave para receber" />
              </SelectTrigger>
              <SelectContent>
                {pixKeys?.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.type.toUpperCase()}: {key.key_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPixKeyId && grossValue && (
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border shadow-sm">
              <Label className="mb-2 text-muted-foreground">QR Code para Pagamento</Label>
              <QRCodeSVG value={getQrCodeValue()} size={150} />
              <p className="mt-2 text-xs text-muted-foreground text-center max-w-[200px] break-all">
                {getQrCodeValue()}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                Valor: R$ {grossValue}
              </p>
            </div>
          )}
        </div>
      )}

      {paymentMethod === "card" && (
        <>
          <div className="space-y-2">
            <Label>Maquininha</Label>
            <Select
              value={selectedMachineId}
              onValueChange={setSelectedMachineId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a maquininha" />
              </SelectTrigger>
              <SelectContent>
                {machines?.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMachineId && (
            <div className="space-y-2">
              <Label>Bandeira / Tipo</Label>
              <Select onValueChange={handleFlagSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a bandeira" />
                </SelectTrigger>
                <SelectContent>
                  {machines
                    ?.find((m) => m.id === selectedMachineId)
                    ?.flags?.map((flag) => (
                      <SelectItem key={flag.id} value={flag.id}>
                        {flag.brand} - {flag.type === 'credit' ? 'Crédito' : 'Débito'} ({flag.tax_rate}%)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Bandeira (Texto)</Label>
            <Input
              {...register("card_brand")}
              placeholder="Ex: Visa, Master"
              readOnly={!!selectedMachineId}
              className={selectedMachineId ? "bg-muted" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Taxa (%)</Label>
            <Input
              type="number"
              step="0.01"
              {...register("tax_rate", { valueAsNumber: true })}
              placeholder="Ex: 2.5"
              readOnly={!!selectedMachineId}
              className={selectedMachineId ? "bg-muted" : ""}
            />
          </div>
        </>
      )}
    </GenericFormDialog>
  );
}

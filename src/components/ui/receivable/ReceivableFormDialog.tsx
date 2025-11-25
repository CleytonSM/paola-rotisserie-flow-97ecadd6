import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Loader2, QrCode } from "lucide-react";
import type { Client, FormData } from "./types";
import { maskCpfCnpj } from "./utils";
import { useQuery } from "@tanstack/react-query";
import { getMachines, getPixKeys } from "@/services/database";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ReceivableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  clients: Client[];
  editingId: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading?: boolean;
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
  loading = false,
}: ReceivableFormDialogProps) {
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
    enabled: formData.payment_method === "pix",
  });

  // Reset selected machine/pix key when dialog closes or resets
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
      setFormData(prev => ({
        ...prev,
        card_brand: `${flag.brand} (${flag.type === 'credit' ? 'Crédito' : 'Débito'})`,
        tax_rate: flag.tax_rate.toString()
      }));
    }
  };

  const handlePixKeySelect = (keyId: string) => {
    setSelectedPixKeyId(keyId);
    // Pix usually has no tax, so we set it to 0
    setFormData(prev => ({
      ...prev,
      tax_rate: "0",
      card_brand: "PIX" // Optional: use card_brand field to store "PIX" for consistency
    }));
  };

  const getQrCodeValue = () => {
    if (!pixKeys || !selectedPixKeyId || !formData.gross_value) return "";
    const key = pixKeys.find(k => k.id === selectedPixKeyId);
    if (!key) return "";

    // Simple Pix Copy and Paste format (simplified)
    // In a real app, you would generate a full BR Code payload here.
    // For now, we'll use a link format that some apps understand or just the key if no amount.
    // But better to just encode the key and amount in a text format for now as a placeholder for full BR Code generation.
    // Ideally, use a library like 'pix-payload-generator' for real BR Code.
    // For this MVP, we will just encode the key value.
    return key.key_value;
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

          {formData.payment_method === "pix" && (
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

              {selectedPixKeyId && formData.gross_value && (
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border shadow-sm">
                  <Label className="mb-2 text-muted-foreground">QR Code para Pagamento</Label>
                  <QRCodeSVG value={getQrCodeValue()} size={150} />
                  <p className="mt-2 text-xs text-muted-foreground text-center max-w-[200px] break-all">
                    {getQrCodeValue()}
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary">
                    Valor: R$ {formData.gross_value}
                  </p>
                </div>
              )}
            </div>
          )}

          {formData.payment_method === "card" && (
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
                  value={formData.card_brand}
                  onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
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
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  placeholder="Ex: 2.5"
                  readOnly={!!selectedMachineId}
                  className={selectedMachineId ? "bg-muted" : ""}
                />
              </div>
            </>
          )}
          <Button
            type="submit"
            className="w-full sm:col-span-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingId ? "Salvando..." : "Adicionando..."}
              </>
            ) : (
              editingId ? "Salvar Alterações" : "Adicionar Entrada"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatPixKey } from "@/lib/masks";

interface MethodPixProps {
    pixKeys: any[];
    selectedPixKey: string;
    setSelectedPixKey: (key: string) => void;
    onGenerateQRCode: () => void;
}

export function MethodPix({ pixKeys, selectedPixKey, setSelectedPixKey, onGenerateQRCode }: MethodPixProps) {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'aleatoria': return 'Chave Aleatória';
            case 'telefone': return 'Telefone';
            case 'cpf': return 'CPF';
            case 'cnpj': return 'CNPJ';
            case 'email': return 'E-mail';
            default: return type;
        }
    };

    return (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <Select value={selectedPixKey} onValueChange={setSelectedPixKey}>
                <SelectTrigger className="border-sidebar-border focus:ring-primary/20">
                    <SelectValue placeholder="Selecione a chave Pix" />
                </SelectTrigger>
                <SelectContent>
                    {pixKeys.map(key => (
                        <SelectItem key={key.id} value={key.id}>
                            {getTypeLabel(key.type)}: {formatPixKey(key.type, key.key_value)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={(e) => {
                    e.stopPropagation();
                    onGenerateQRCode();
                }}
                disabled={!selectedPixKey}
            >
                Gerar QR Code
            </Button>
        </div>
    );
}

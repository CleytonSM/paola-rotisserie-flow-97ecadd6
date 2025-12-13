import { Edit, Trash2, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PixKey, togglePixKeyStatus } from "@/services/database";
import { toast } from "sonner";
import { useState } from "react";
import { formatPixKey } from "@/lib/masks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PixKeyCardProps {
    pixKey: PixKey;
    onEdit: (pixKey: PixKey) => void;
    onDelete: (pixKey: PixKey) => void;
    onToggleStatus: (pixKey: PixKey) => void;
}

export function PixKeyCard({ pixKey, onEdit, onDelete, onToggleStatus }: PixKeyCardProps) {
    const [copied, setCopied] = useState(false);
    const [isActive, setIsActive] = useState(pixKey.active);

    const handleCopy = () => {
        navigator.clipboard.writeText(pixKey.key_value);
        setCopied(true);
        toast.success("Chave copiada!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggle = async (checked: boolean) => {
        setIsActive(checked);

        try {
            const { error } = await togglePixKeyStatus(pixKey.id, checked);
            if (error) {
                setIsActive(!checked);
                throw error;
            }
            onToggleStatus(pixKey);
            toast.success(`Chave ${checked ? "ativada" : "desativada"}!`);
        } catch (error) {
            toast.error("Erro ao alterar status da chave");
        }
    };

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
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex flex-col">
                    <CardTitle className="text-lg font-playfair">{getTypeLabel(pixKey.type)}</CardTitle>
                    <span className="text-xs text-muted-foreground mt-1">
                        {pixKey.created_at && format(new Date(pixKey.created_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                </div>
                <Switch
                    checked={isActive}
                    onCheckedChange={handleToggle}
                    aria-label="Ativar chave"
                />
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    <div className="relative p-3 bg-muted rounded-md font-mono text-sm break-all text-center group">
                        <span className="mr-6">{formatPixKey(pixKey.type, pixKey.key_value)}</span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-background/50"
                                            onClick={handleCopy}
                                        >
                                            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{copied ? "Copiado!" : "Copiar"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 opacity-90 hover:opacity-100 shadow-sm"
                            onClick={() => onEdit(pixKey)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 opacity-90 hover:opacity-100"
                            onClick={() => onDelete(pixKey)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

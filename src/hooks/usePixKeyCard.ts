import { useState } from "react";
import { toast } from "sonner";
import { PixKey, togglePixKeyStatus } from "@/services/database";

interface UsePixKeyCardProps {
    pixKey: PixKey;
    onToggleStatus: () => void;
}

export function usePixKeyCard({ pixKey, onToggleStatus }: UsePixKeyCardProps) {
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
            onToggleStatus();
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

    return {
        copied,
        isActive,
        handleCopy,
        handleToggle,
        getTypeLabel,
    };
}

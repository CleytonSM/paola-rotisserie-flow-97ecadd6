import { useState } from "react";
import { toast } from "sonner";
import { PixKey, togglePixKeyStatus } from "@/services/database";

interface UsePixKeyCardProps {
    pixKey: PixKey;
    onToggleStatus: () => void;
}

/**
 * Custom hook to manage PixKeyCard state and interactions
 * Handles copy to clipboard and toggle active status with optimistic updates
 */
export function usePixKeyCard({ pixKey, onToggleStatus }: UsePixKeyCardProps) {
    const [copied, setCopied] = useState(false);
    const [isActive, setIsActive] = useState(pixKey.active);

    /**
     * Copy PIX key value to clipboard
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(pixKey.key_value);
        setCopied(true);
        toast.success("Chave copiada!");
        setTimeout(() => setCopied(false), 2000);
    };

    /**
     * Toggle PIX key active status with optimistic update
     */
    const handleToggle = async (checked: boolean) => {
        // Optimistic update
        setIsActive(checked);

        try {
            const { error } = await togglePixKeyStatus(pixKey.id, checked);
            if (error) {
                // Revert on error
                setIsActive(!checked);
                throw error;
            }
            onToggleStatus();
            toast.success(`Chave ${checked ? "ativada" : "desativada"}!`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar status da chave");
        }
    };

    /**
     * Get formatted label for PIX key type
     */
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

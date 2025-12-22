import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NewOrderButtonProps {
    onClick: () => void;
}

export function NewOrderButton({ onClick }: NewOrderButtonProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={onClick}
                        className="h-10 px-4 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 font-bold"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        <span className="hidden sm:inline">Novo Pedido</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Criar pedido manual</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

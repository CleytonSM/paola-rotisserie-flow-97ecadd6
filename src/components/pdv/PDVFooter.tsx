import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PDVFooterProps {
    total: number;
    hasItems: boolean;
}

export function PDVFooter({ total, hasItems }: PDVFooterProps) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    return (
        <div className="m-4 mt-0 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-sidebar-border z-20">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm text-muted-foreground mb-1">Subtotal</p>
                    <p className="text-xl md:text-3xl font-bold text-foreground truncate">{formatCurrency(total)}</p>
                </div>
                {isMobile ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className="h-12 w-12 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl transition-all active:scale-95"
                                    disabled={!hasItems}
                                    onClick={() => navigate("/pdv/payment")}
                                >
                                    <ArrowRight className="h-6 w-6" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Finalizar Pedido</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Button
                        size="lg"
                        className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl transition-all active:scale-95"
                        disabled={!hasItems}
                        onClick={() => navigate("/pdv/payment")}
                    >
                        Finalizar Pedido
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";

interface PDVFooterProps {
    total: number;
    hasItems: boolean;
}

export function PDVFooter({ total, hasItems }: PDVFooterProps) {
    const navigate = useNavigate();

    return (
        <div className="m-4 mt-0 bg-white rounded-2xl p-6 shadow-sm border border-sidebar-border z-20">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
                </div>
                <Button
                    size="lg"
                    className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl transition-all active:scale-95"
                    disabled={!hasItems}
                    onClick={() => navigate("/pdv/payment")}
                >
                    Finalizar Pedido
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}

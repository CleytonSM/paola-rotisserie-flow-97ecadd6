import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function PaymentHeader() {
    const navigate = useNavigate();
    return (
        <div className="m-4 mb-0 bg-card rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm z-10 border border-sidebar-border">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/pdv")}>
                <ArrowLeft className="h-6 w-6 text-primary" />
            </Button>
            <h1 className="text-2xl font-playfair font-bold text-foreground">Finalizar Pedido</h1>
        </div>
    );
}

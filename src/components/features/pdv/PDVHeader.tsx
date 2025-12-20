import { ShoppingCart } from "lucide-react";

interface PDVHeaderProps {
    itemCount: number;
}

export function PDVHeader({ itemCount }: PDVHeaderProps) {
    return (
        <div className="m-4 mb-0 bg-card rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm z-10 border border-sidebar-border">
            <h1 className="text-2xl font-playfair font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                PDV <span className="text-muted-foreground font-sans text-sm font-normal">Nova Venda</span>
            </h1>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Itens</p>
                    <p className="font-bold text-lg text-foreground">{itemCount}</p>
                </div>
            </div>
        </div>
    );
}

import React from "react";
import { useCatalogStore } from "@/stores/useCatalogStore";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { Link } from "react-router-dom";
import { SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { BrandedScrollArea } from "@/components/ui/branded-scroll-area";
import { formatWeight, parseBrazilianNumber } from "@/lib/masks";
import { Input } from "@/components/ui/input";

export const CatalogCartDrawer = () => {
    const { items, removeItem, updateQuantity, total, itemCount } = useCatalogStore();
    const cartTotal = total();
    const count = itemCount();

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
                <div className="bg-muted rounded-full p-6 mb-4">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-bold mb-2">Seu carrinho está vazio</h3>
                <p className="text-muted-foreground mb-8">Navegue pelo nosso cardápio e adicione seus pratos favoritos!</p>
                <SheetClose asChild>
                    <Button className="w-full">Voltar ao Cardápio</Button>
                </SheetClose>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full ring-offset-background focus:outline-none">
            <SheetHeader className="px-6 py-4">
                <SheetTitle className="flex items-center gap-2">
                    Meu Carrinho
                    <span className="text-sm font-normal text-muted-foreground">({count} {count === 1 ? 'item' : 'itens'})</span>
                </SheetTitle>
            </SheetHeader>
            <Separator />

            <BrandedScrollArea className="flex-1 px-6">
                <div className="py-6 space-y-6">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="h-20 w-20 rounded-lg object-cover bg-muted flex-shrink-0"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                    <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base leading-tight truncate mb-1">{item.name}</h4>
                                <p className="text-primary font-semibold mb-3">
                                    {formatCurrency(item.base_price)}
                                    {item.unit_type === 'kg' && <span className="text-xs font-normal text-muted-foreground"> /kg</span>}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center border rounded-md overflow-hidden bg-background">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-none border-r"
                                            onClick={() => {
                                                const step = item.unit_type === 'kg' ? 0.1 : 1;
                                                updateQuantity(item.id, Math.max(0, item.quantity - step));
                                            }}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>

                                        {item.unit_type === 'kg' ? (
                                            <Input
                                                className="w-20 h-8 border-0 rounded-none text-center text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
                                                value={item.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                                                onChange={(e) => {
                                                    const maskedValue = formatWeight(e.target.value);
                                                    const numericValue = parseBrazilianNumber(maskedValue);
                                                    updateQuantity(item.id, numericValue);
                                                }}
                                            />
                                        ) : (
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-none border-l"
                                            onClick={() => {
                                                const step = item.unit_type === 'kg' ? 0.1 : 1;
                                                updateQuantity(item.id, item.quantity + step);
                                            }}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </BrandedScrollArea>

            <Separator />
            <div className="p-6 flex flex-col gap-4">
                <div className="w-full space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t border-border pt-3 mt-1">
                        <span>Total estimado</span>
                        <span className="text-primary text-xl">{formatCurrency(cartTotal)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic text-center uppercase tracking-widest pt-3 leading-relaxed">
                        Preços de itens pesados podem variar conforme o peso real na pesagem final.
                    </p>
                </div>

                <SheetClose asChild>
                    <Button asChild className="w-full h-14 text-base font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
                        <Link to="/cardapio/checkout">Finalizar Pedido</Link>
                    </Button>
                </SheetClose>
            </div>
        </div>
    );
};

import { ShoppingBasket } from "lucide-react";

export function EmptyCartState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="bg-primary-100 p-6 rounded-full mb-4 animate-pulse">
                <ShoppingBasket className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-playfair font-semibold text-gray-700 mb-2">
                Seu carrinho está vazio
            </h3>
            <p className="text-gray-500 max-w-[200px]">
                Escaneie um produto ou busque pelo nome para começar a venda!
            </p>
        </div>
    );
}

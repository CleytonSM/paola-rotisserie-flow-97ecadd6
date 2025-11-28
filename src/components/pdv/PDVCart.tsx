import { CartItem } from "@/components/pdv/CartItem";
import { EmptyCartState } from "@/components/pdv/EmptyCartState";
import { CartItem as CartItemType } from "@/stores/cartStore";

interface PDVCartProps {
    items: CartItemType[];
}

export function PDVCart({ items }: PDVCartProps) {
    return (
        <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="max-w-3xl mx-auto h-full">
                {items.length === 0 ? (
                    <EmptyCartState />
                ) : (
                    <div className="space-y-2 pb-24">
                        {items.map((item) => (
                            <CartItem key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

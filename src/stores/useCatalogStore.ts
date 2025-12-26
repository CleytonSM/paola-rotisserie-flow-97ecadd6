import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CatalogCartItem {
    id: string;
    name: string;
    base_price: number;
    quantity: number;
    image_url?: string | null;
    unit_type?: string;
}

export interface ClientDetails {
    name: string;
    phone: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
}

interface CatalogCartState {
    items: CatalogCartItem[];
    clientDetails: ClientDetails | null;
    lastOrderedProductIds: string[];
    addItem: (product: { id: string; name: string; base_price: number; image_url?: string | null; unit_type?: string }) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    updateClientDetails: (details: ClientDetails | null) => void;
    setLastOrderedProductIds: (ids: string[]) => void;
    total: () => number;
    itemCount: () => number;
}

export const useCatalogStore = create<CatalogCartState>()(
    persist(
        (set, get) => ({
            items: [],
            clientDetails: null,
            lastOrderedProductIds: [],

            addItem: (product) => {
                const items = get().items;
                const existingItem = items.find(item => item.id === product.id);

                if (existingItem) {
                    set({
                        items: items.map(item =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({
                        items: [...items, {
                            id: product.id,
                            name: product.name,
                            base_price: product.base_price,
                            image_url: product.image_url,
                            unit_type: product.unit_type,
                            quantity: 1
                        }]
                    });
                }
            },

            removeItem: (productId) => {
                set({ items: get().items.filter(item => item.id !== productId) });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map(item =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            updateClientDetails: (details) => {
                set({ clientDetails: details });
            },

            setLastOrderedProductIds: (ids) => {
                set({ lastOrderedProductIds: ids });
            },

            total: () => {
                const total = get().items.reduce((sum, item) => sum + item.base_price * item.quantity, 0);
                return Math.round(total * 100) / 100;
            },

            itemCount: () => {
                return get().items.reduce((sum, item) => sum + (item.unit_type === 'kg' ? 1 : item.quantity), 0);
            },
        }),
        {
            name: 'paola-catalog-cart',
        }
    )
);

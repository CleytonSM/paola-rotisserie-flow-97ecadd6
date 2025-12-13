import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SubItem {
    id: string;
    weight: number;
    price: number;
    barcode: number;
}

export interface CartItem {
    id: string;
    name: string;
    base_price: number;
    quantity: number;
    stock?: number;
    notes?: string;
    is_internal?: boolean;
    unit_type?: string;
    catalog_id?: string;
    scanned_barcode?: string;
    subItems?: SubItem[];
}

interface AddItemPayload {
    id: string;
    name: string;
    base_price: number;
    is_internal?: boolean;
    catalog_id?: string;
    sub_item_id?: string;
    weight?: number;
    catalog_barcode?: number;
    scanned_barcode?: string;
    unit_type?: string;
    quantity?: number;
}

interface CartState {
    items: CartItem[];
    customerName?: string;
    addItem: (product: AddItemPayload) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeSubItem: (catalogId: string, subItemId: string) => void;
    clearCart: () => void;
    setCustomerName: (name: string) => void;
    total: () => number;
    itemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            customerName: '',

            addItem: (product) => {
                const items = get().items;
                const targetCatalogId = product.catalog_id || product.id;
                const isInternal = product.is_internal;
                const productStock = product.quantity;

                if (isInternal) {
                    const existingGroupIndex = items.findIndex(
                        item => item.id === targetCatalogId && item.is_internal
                    );

                    const newSubItem: SubItem = {
                        id: product.sub_item_id || product.id,
                        weight: product.weight || 0,
                        price: product.base_price,
                        barcode: product.catalog_barcode || 0
                    };

                    if (existingGroupIndex > -1) {
                        const newItems = [...items];
                        const group = { ...newItems[existingGroupIndex] };
                        group.subItems = [...(group.subItems || []), newSubItem];
                        group.quantity = group.subItems.length;
                        newItems[existingGroupIndex] = group;
                        set({ items: newItems });
                    } else {
                        set({
                            items: [...items, {
                                id: targetCatalogId,
                                name: product.name,
                                base_price: product.base_price,
                                quantity: 1,
                                is_internal: true,
                                subItems: [newSubItem],
                                stock: productStock
                            }]
                        });
                    }
                    return;
                }

                // Standard product logic
                const existingItem = items.find(item => item.id === product.id);

                if (existingItem) {
                    set({
                        items: items.map(item =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1, stock: productStock ?? item.stock }
                                : item
                        ),
                    });
                } else {
                    set({
                        items: [...items, {
                            id: product.id,
                            name: product.name,
                            base_price: product.base_price,
                            quantity: 1,
                            stock: productStock
                        }]
                    });
                }
            },

            removeItem: (productId) => {
                set({ items: get().items.filter(item => item.id !== productId) });
            },

            removeSubItem: (catalogId, subItemId) => {
                const items = get().items;
                const updatedItems = items.map(item => {
                    if (item.id === catalogId && item.subItems) {
                        const newSubItems = item.subItems.filter(sub => sub.id !== subItemId);
                        if (newSubItems.length === 0) return null;
                        return { ...item, subItems: newSubItems, quantity: newSubItems.length };
                    }
                    return item;
                }).filter(Boolean) as CartItem[];

                set({ items: updatedItems });
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

            clearCart: () => set({ items: [], customerName: '' }),

            setCustomerName: (name) => set({ customerName: name }),

            total: () => {
                return get().items.reduce((sum, item) => {
                    if (item.subItems && item.subItems.length > 0) {
                        return sum + item.subItems.reduce((subSum, sub) => subSum + sub.price, 0);
                    }
                    return sum + item.base_price * item.quantity;
                }, 0);
            },

            itemCount: () => {
                return get().items.reduce((sum, item) => sum + item.quantity, 0);
            },
        }),
        {
            name: 'pdv-cart-storage',
        }
    )
);

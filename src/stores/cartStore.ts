import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/services/database/products';

export interface CartItem extends Product {
  quantity: number;
  stock?: number;
  notes?: string;
  is_internal?: boolean;
  unit_type?: string;
  subItems?: {
    id: string; // Specific item ID (e.g. from product_item)
    weight: number;
    price: number;
    barcode: number;
  }[];
}

interface CartState {
  items: CartItem[];
  customerName?: string;
  addItem: (product: Product) => void;
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
        
        // Check if it's an internal product item being added (it should have subItem data passed in 'product' or handled here)
        // Actually, the caller passes a 'constructed' object.
        // We need to detect if we should group it.
        
        // Strategy: 
        // 1. If product is internal (checked via flag or presence of specific props), look for existing group.
        // 2. The 'product' passed here for internal items is currently a constructed object from `handleInternalItemSelect`.
        //    We need to ensure it has `is_internal: true` and the sub-item details.

        // Let's assume the passed `product` object for internal items has: 
        //   id: product_item.id (unique per item)
        //   internal_code: ...
        //   parent_id: catalog_id (WE NEED THIS to group!) 
        //   ... 
        // Wait, `handleInternalItemSelect` in `usePDV` constructs the object.
        // We should probably pass the sub-item as a separate property or ensure the passed object has what we need.

        // BETTER APPROACH for `addItem`:
        // Accept `product` (ProductCatalog info) and optional `subItem` info.
        // But `addItem` signature is `(product: Product) => void`.
        // The `Product` interface in `products.ts` is simple. 
        // `CartItem` extends it.
        
        // Let's rely on `product.internal_code` or a new property `catalog_id` to matching.
        // For standard products, `id` IS the `catalog_id` (or `product_id`).
        // For internal items, the `id` passed currently is `product_item.id`.
        
        // We need a stable identifier for the GROUP.
        // If `is_internal`, we should group by `internal_code` (if unique per product) or `name`? 
        // Best is to use `catalog_id`.
        // Let's updated `CartItem` to include `catalog_id`.

        const targetCatalogId = (product as any).catalog_id || product.id; // Fallback for standard products where id is the main id.
        const isInternal = (product as any).is_internal;
        const productStock = (product as any).quantity; // Capture stock from input product (ProductCatalog)

        if (isInternal) {
             // Try to find existing group for this catalog product
             const existingGroupIndex = items.findIndex(item => item.id === targetCatalogId && item.is_internal);

             if (existingGroupIndex > -1) {
                 // Add to existing group
                 const newSubItem = {
                     id: (product as any).sub_item_id || product.id, // The specific item ID
                     weight: (product as any).weight || 0,
                     price: product.base_price,
                     barcode: (product as any).catalog_barcode || 0 // Actually scale barcode
                 };

                 const newItems = [...items];
                 const group = { ...newItems[existingGroupIndex] };
                 
                 group.subItems = [...(group.subItems || []), newSubItem];
                 group.quantity = group.subItems.length; // Quantity is count of items
                 // base_price of the group could be sum, but `total()` handles logic.
                 // let's keep base_price as 0 or unit price? 
                 // If we keep base_price as unit price, total() = base * qty, which is WRONG for variable weights.
                 // So for internal groups, base_price in CartItem might be irrelevant or average. 
                 // We will fix `total()` to sum subItems if they exist.
                 
                 newItems[existingGroupIndex] = group;
                 set({ items: newItems });
                 return;
             } else {
                 // Create new group
                 // We need to ensure the ID of the CART ITEM is the CATALOG ID, so we can find it later.
                 // But `handleInternalItemSelect` passes `product_item.id` as `id`.
                 // We need to change that upstream or handle it here.
                 // Let's assume `product` passed here has `id` = `catalog_id` and we extract sub-item info from it.
                 // OR we handle the `product` object being a specific item and we extract catalog ID.
                 
                 // Let's enforce that for internal items, the `product` object passed to addItem MUST have `catalog_id`.
                 // And we use `catalog_id` as the `CartItem.id`.
                 
                 const newSubItem = {
                     id: (product as any).sub_item_id || product.id, 
                     weight: (product as any).weight || 0,
                     price: product.base_price,
                     barcode: (product as any).catalog_barcode || 0
                 };

                 set({ 
                     items: [...items, { 
                         ...product, 
                         id: targetCatalogId, // Group ID
                         quantity: 1,
                         is_internal: true,
                         subItems: [newSubItem],
                         stock: productStock
                     }] 
                 });
                 return;
             }
        }

        // Standard Product Logic (unchanged essentially)
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1, stock: productStock ?? item.stock } // Update stock if fresh info provided
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1, stock: productStock }] });
        }
      },
      removeItem: (productId) => {
          // If it's a sub-item removal request? 
          // Usually removeItem takes the CartItem ID.
          // If we want to remove a specific sub-item, we might need a dedicated `removeSubItem` action.
          // For now, `removeItem` removes the whole group/product.
          set({ items: get().items.filter((item) => item.id !== productId) });
      },
      removeSubItem: (catalogId: string, subItemId: string) => {
          const items = get().items;
          const updatedItems = items.map(item => {
              if (item.id === catalogId && item.subItems) {
                  const newSubItems = item.subItems.filter(sub => sub.id !== subItemId);
                  if (newSubItems.length === 0) return null; // Remove group if empty
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
          items: get().items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [], customerName: '' }),
      setCustomerName: (name) => set({ customerName: name }),
      total: () => {
        return get().items.reduce((sum, item) => {
            if (item.subItems && item.subItems.length > 0) {
                // Sum of sub-items prices
                const groupTotal = item.subItems.reduce((subSum, sub) => subSum + sub.price, 0);
                return sum + groupTotal;
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

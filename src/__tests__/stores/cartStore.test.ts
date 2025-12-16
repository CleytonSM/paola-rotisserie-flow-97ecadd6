import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/stores/cartStore';

/**
 * Tests for the cart store functionality used by usePDV hook.
 * The usePDV hook wraps the cart store with additional logic.
 * 
 * Note: `total` and `itemCount` are getter functions and must be called with ().
 */
describe('Cart Store (usePDV underlying store)', () => {
  
  beforeEach(() => {
    // Reset the store before each test
    useCartStore.getState().clearCart();
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      const { addItem } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });

      const updatedItems = useCartStore.getState().items;
      expect(updatedItems).toHaveLength(1);
      expect(updatedItems[0].name).toBe('Frango Assado');
      expect(updatedItems[0].base_price).toBe(25.00);
    });

    it('should increase quantity when adding existing item', () => {
      const { addItem } = useCartStore.getState();
      
      // Add same item twice
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should calculate correct total for multiple items', () => {
      const { addItem } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });
      
      addItem({
        id: 'product-2',
        name: 'Farofa',
        base_price: 10.00,
        is_internal: false,
        unit_type: 'un',
      });

      // total is a getter function - must call with ()
      const total = useCartStore.getState().total();
      expect(total).toBe(35.00);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const { addItem, removeItem } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });

      expect(useCartStore.getState().items).toHaveLength(1);
      
      removeItem('product-1');
      
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { addItem, updateQuantity } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });

      updateQuantity('product-1', 5);
      
      const { items } = useCartStore.getState();
      const total = useCartStore.getState().total();
      expect(items[0].quantity).toBe(5);
      expect(total).toBe(125.00); // 25 * 5
    });

    it('should remove item when quantity is set to 0', () => {
      const { addItem, updateQuantity } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });

      updateQuantity('product-1', 0);
      
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const { addItem, clearCart } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });
      
      addItem({
        id: 'product-2',
        name: 'Farofa',
        base_price: 10.00,
        is_internal: false,
        unit_type: 'un',
      });

      expect(useCartStore.getState().items).toHaveLength(2);
      
      clearCart();
      
      expect(useCartStore.getState().items).toHaveLength(0);
      // total is a getter function
      expect(useCartStore.getState().total()).toBe(0);
    });
  });

  describe('itemCount', () => {
    it('should return total item count including quantities', () => {
      const { addItem, updateQuantity } = useCartStore.getState();
      
      addItem({
        id: 'product-1',
        name: 'Frango Assado',
        base_price: 25.00,
        is_internal: false,
        unit_type: 'un',
      });
      
      updateQuantity('product-1', 3);
      
      addItem({
        id: 'product-2',
        name: 'Farofa',
        base_price: 10.00,
        is_internal: false,
        unit_type: 'un',
      });

      // itemCount is a getter function - must call with ()
      const itemCount = useCartStore.getState().itemCount();
      expect(itemCount).toBe(4); // 3 + 1
    });
  });

  describe('internal products (kg-based)', () => {
    it('should handle internal products with weight', () => {
      const { addItem } = useCartStore.getState();
      
      addItem({
        id: 'internal-1',
        name: 'Frango Desossado',
        base_price: 45.90,
        is_internal: true,
        unit_type: 'kg',
        weight: 1.5,
        catalog_id: 'catalog-1',
        scanned_barcode: '2000012345678',
      });

      const { items } = useCartStore.getState();
      const total = useCartStore.getState().total();
      
      expect(items).toHaveLength(1);
      expect(items[0].is_internal).toBe(true);
      
      // For internal products, weight is stored in subItems array, not directly on item
      expect(items[0].subItems).toBeDefined();
      expect(items[0].subItems![0].weight).toBe(1.5);
      
      // Total should be based on the subItem prices
      expect(total).toBeGreaterThan(0);
    });

    it('should track sub-items for internal products', () => {
      const { addItem } = useCartStore.getState();
      
      addItem({
        id: 'internal-1',
        name: 'Frango Desossado',
        base_price: 45.90,
        is_internal: true,
        unit_type: 'kg',
        weight: 1.5,
        catalog_id: 'catalog-1',
        sub_item_id: 'sub-item-1',
        scanned_barcode: '2000012345678',
      });

      const { items } = useCartStore.getState();
      // sub_item_id goes into the subItems array, not as a direct property
      expect(items[0].subItems).toBeDefined();
      expect(items[0].subItems).toHaveLength(1);
      expect(items[0].subItems![0].id).toBe('sub-item-1');
    });
  });
});

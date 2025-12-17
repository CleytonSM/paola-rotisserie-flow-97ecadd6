import { useState, useCallback } from "react";
import { useCartStore, CartItem, AddItemPayload } from "@/stores/cartStore";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductItem } from "@/services/database/product-items";
import { useProductSearch } from "@/hooks/useProductSearch";

export function usePDV() {
    const { items, addItem, total, itemCount } = useCartStore();
    const { 
        searchQuery, setSearchQuery, searchResults, 
        showPreview, setShowPreview, searchContainerRef, 
        performSearch, clearSearch 
    } = useProductSearch();

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductCatalog | null>(null);

    const isMobile = useIsMobile();

    const checkDuplicate = useCallback((barcodeToCheck: string, currentItems: CartItem[]): boolean => {
        return currentItems.some(cartItem => {
            if (cartItem.scanned_barcode === barcodeToCheck) return true;
            if (cartItem.subItems?.some(sub => String(sub.barcode) === barcodeToCheck)) return true;
            return false;
        });
    }, []);

    const handleProductSelect = useCallback((product: ProductCatalog) => {
        if (product.is_internal) {
            setSelectedProduct(product);
            setSelectionOpen(true);
            clearSearch();
            return;
        }

        // Stock validation for non-internal products
        if (product.quantity !== undefined && product.quantity !== null) {
            const currentItems = useCartStore.getState().items;
            const currentInCart = currentItems.find(i => i.id === product.id)?.quantity || 0;
            const availableStock = product.quantity - currentInCart;
            
            if (availableStock <= 0) {
                toast.error(`Produto sem estoque disponível!`);
                return;
            }
            
            if (currentInCart + 1 > product.quantity) {
                toast.error(`Estoque insuficiente! Apenas ${availableStock} unidade(s) disponível(is).`);
                return;
            }
        }

        addItem({ ...product });
        clearSearch();
        toast.success(`Produto adicionado: ${product.name}`);
    }, [addItem, clearSearch]);

    const handleInternalItemSelect = useCallback((item: ProductItem) => {
        const catalogData = selectedProduct || item.product_catalog;
        
        if (!catalogData) {
            toast.error("Erro: Dados do produto não encontrados.");
            return;
        }

        const barcodeToCheck = String(item.scale_barcode);
        const currentItems = useCartStore.getState().items;
        
        if (checkDuplicate(barcodeToCheck, currentItems)) {
            toast.warning("Este item já foi adicionado ao pedido!");
            setIsScannerOpen(false);
            setSelectionOpen(false);
            setSelectedProduct(null);
            return;
        }

        const payload: AddItemPayload = {
            id: catalogData.id,
            name: catalogData.name,
            base_price: item.sale_price,
            is_internal: true,
            catalog_id: catalogData.id,
            sub_item_id: item.id,
            weight: item.weight_kg,
            catalog_barcode: item.scale_barcode,
            scanned_barcode: barcodeToCheck,
            unit_type: 'un',
        };

        addItem(payload);
        setSelectionOpen(false);
        setSelectedProduct(null);
        toast.success(`Item adicionado: ${catalogData.name}`);
    }, [selectedProduct, addItem, checkDuplicate]);

    const handleScannedProduct = useCallback(async (
        product: ProductCatalog, 
        overridePrice?: number, 
        rawBarcode?: string
    ) => {
        if (overridePrice !== undefined) {
            const currentItems = useCartStore.getState().items;
            
            if (rawBarcode && checkDuplicate(rawBarcode, currentItems)) {
                toast.warning("Este item já foi adicionado ao pedido!");
                setIsScannerOpen(false);
                clearSearch();
                return;
            }

            const payload: AddItemPayload = {
                id: product.id,
                name: product.name,
                base_price: overridePrice,
                is_internal: true,
                catalog_id: product.id,
                sub_item_id: undefined,
                weight: product.unit_type === 'kg' && product.base_price > 0 
                    ? Number((overridePrice / product.base_price).toFixed(3)) 
                    : 1,
                catalog_barcode: product.catalog_barcode ?? undefined,
                scanned_barcode: rawBarcode,
                unit_type: product.unit_type,
            };

            addItem(payload);
            clearSearch();
            toast.success(`Item adicionado: ${product.name} (R$ ${overridePrice.toFixed(2)})`);
            return;
        }

        handleProductSelect(product);
    }, [addItem, handleProductSelect, clearSearch, checkDuplicate]);

    const handleAddInternalItem = useCallback(async (catalogId: string) => {
        const cartItem = items.find(i => i.id === catalogId);
        
        if (cartItem) {
            const productCatalogForSelection: ProductCatalog = {
                id: cartItem.id,
                name: cartItem.name,
                base_price: cartItem.base_price,
                unit_type: cartItem.unit_type as 'kg' | 'un',
                is_active: true,
                is_internal: true,
                catalog_barcode: cartItem.subItems?.[0]?.barcode
            };
            
            setSelectedProduct(productCatalogForSelection);
            setSelectionOpen(true);
        } else {
            const { data } = await searchProductCatalog(catalogId);
            if (data && data.length > 0) {
                setSelectedProduct(data[0]);
                setSelectionOpen(true);
            }
        }
    }, [items]);

    const handleButtonClick = useCallback(() => {
        if (isMobile) {
            setIsScannerOpen(true);
        } else {
            if (searchResults.length === 0) performSearch(searchQuery);
        }
    }, [isMobile, searchResults, performSearch, searchQuery]);

    return {
        items,
        total,
        itemCount,
        searchQuery,
        setSearchQuery,
        searchResults,
        isScannerOpen,
        setIsScannerOpen,
        showPreview,
        setShowPreview,
        searchContainerRef,
        handleProductSelect,
        handleButtonClick,
        isMobile,
        performSearch,
        selectionOpen,
        setSelectionOpen,
        selectedProduct,
        handleInternalItemSelect,
        handleScannedProduct,
        handleAddInternalItem
    };
}

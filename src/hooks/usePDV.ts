import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cartStore";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductItem } from "@/services/database/product-items";

export function usePDV() {
    const { items, addItem, total, itemCount } = useCartStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ProductCatalog[]>([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    // Internal Product Selection State
    const [selectionOpen, setSelectionOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductCatalog | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isMobile = useIsMobile();
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Close preview when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowPreview(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const performSearch = async (query: string) => {
        if (query.length >= 3) {
            const { data } = await searchProductCatalog(query);
            if (data) {
                setSearchResults(data);
                setShowPreview(true);
            }
        } else {
            setSearchResults([]);
            setShowPreview(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleProductSelect = (product: ProductCatalog) => {
        if (product.is_internal) {
            setSelectedProduct(product);
            setSelectionOpen(true);
            setShowPreview(false);
            setSearchQuery("");
            setSearchResults([]);
            return;
        }

        const cartItem: any = {
            ...product,
        };
        addItem(cartItem);
        setSearchQuery("");
        setSearchResults([]);
        setShowPreview(false);
        toast.success(`Produto adicionado: ${product.name}`);
    };

    const handleInternalItemSelect = (item: ProductItem) => {
        if (!selectedProduct) return;

        const cartItem: any = {
            id: selectedProduct.id, // Use CATALOG ID as the main ID for grouping
            name: selectedProduct.name, // Use generic name
            base_price: item.sale_price, // This will be used as price for this sub-item
            // Additional info for grouping logic
            is_internal: true,
            catalog_id: selectedProduct.id,
            sub_item_id: item.id,
            weight: item.weight_kg,
            catalog_barcode: item.scale_barcode, // Scale barcode
            
            // Legacy/Standard fields
            internal_code: selectedProduct.internal_code,
            unit_type: 'un', 
        };

        addItem(cartItem);
        setSelectionOpen(false);
        setSelectedProduct(null);
        toast.success(`Item adicionado: ${selectedProduct.name}`);
    };

    // Scanner logic
    useEffect(() => {
        if (isScannerOpen && !scannerRef.current) {
            const initScanner = async () => {
                if (!document.getElementById("reader")) {
                    setTimeout(initScanner, 100);
                    return;
                }

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                try {
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        async (decodedText) => {
                            const { data } = await searchProductCatalog(decodedText);
                            if (data && data.length > 0) {
                                const product = data[0];
                                handleProductSelect(product);
                                setIsScannerOpen(false);
                                await html5QrCode.stop();
                                html5QrCode.clear();
                            } else {
                                toast.error("Produto não encontrado");
                            }
                        },
                        (errorMessage) => {
                            // ignore errors
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                    toast.error("Erro ao iniciar câmera");
                    setIsScannerOpen(false);
                }
            };

            initScanner();
        }

        return () => {
            if (!isScannerOpen && scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current.clear();
                scannerRef.current = null;
            }
        };
    }, [isScannerOpen, addItem]);

    const handleButtonClick = () => {
        if (isMobile) {
            setIsScannerOpen(true);
        } else {
            if (searchResults.length > 0) {
                // Optional: handle search button click when results are shown
            } else {
                performSearch(searchQuery);
            }
        }
    };

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
        // Expose helper to open selection dialog from cart
        handleAddInternalItem: async (catalogId: string) => {
             // We need to set selectedProduct to open the dialog.
             // We can try to find it in the search cache (unlikely) or fetch it.
             // For reliability, let's fetch it by ID.
             const { data, error } = await searchProductCatalog(catalogId); // Assuming search supports ID or we have getProductCatalog
             // Actually searchProductCatalog is likely text search.
             // We should check if we have a direct lookup. If not, use search or assume we can get it from the cart item?
             // Cart item has `name`, `internal_code`, `base_price` (maybe), etc. 
             // But simpler to just use the CartItem as the "ProductCatalog" basis if possible, 
             // OR implement a proper fetch.
             
             // Let's assume for now we search by ID (if supported) or name.
             // A better way: find the item in local cart which has the catalog data!
             const cartItem = items.find(i => i.id === catalogId);
             if (cartItem) {
                 // Construct a ProductCatalog-like object from CartItem
                 const productCatalogForSelection = {
                     id: cartItem.id, // catalog_id
                     name: cartItem.name,
                     base_price: cartItem.base_price, // This might be unit price?
                     internal_code: cartItem.internal_code,
                     unit_type: cartItem.unit_type,
                     is_active: true,
                     is_internal: true, // We know it is
                     // other fields might be missing but maybe not needed for the dialog header?
                 } as ProductCatalog;
                 
                 setSelectedProduct(productCatalogForSelection);
                 setSelectionOpen(true);
             }
        }
    };
}

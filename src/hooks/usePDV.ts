import { useState, useEffect, useRef, useCallback } from "react";
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

    const performSearch = useCallback(async (query: string) => {
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
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 150);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleProductSelect = useCallback((product: ProductCatalog) => {
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
    }, [addItem]);

    const handleInternalItemSelect = useCallback((item: ProductItem) => {
        // Fallback for catalog data: use selectedProduct state OR item.product_catalog join
        const catalogData = selectedProduct || item.product_catalog;
        
        if (!catalogData) {
            toast.error("Erro: Dados do produto não encontrados.");
            return;
        }

        // Check for duplicate manually (Deep check including sub-items)
        const barcodeToCheck = String(item.scale_barcode);
        const isDuplicate = items.some((cartItem: any) => {
            // 1. Check top-level scanned_barcode (for non-grouped or first items)
            if (cartItem.scanned_barcode === barcodeToCheck) return true;
            
            // 2. Check sub-items array (for grouped internal items)
            if (cartItem.subItems && cartItem.subItems.some((sub: any) => String(sub.barcode) === barcodeToCheck)) {
                return true;
            }
            
            return false;
        });

        if (isDuplicate) {
            toast.warning("Este item já foi adicionado ao pedido!");
            setSelectionOpen(false);
            setSelectedProduct(null);
            return;
        }

        const cartItem: any = {
            id: catalogData.id, // Use CATALOG ID as the main ID for grouping
            name: catalogData.name, // Use generic name
            base_price: item.sale_price, // This will be used as price for this sub-item
            // Additional info for grouping logic
            is_internal: true,
            catalog_id: catalogData.id,
            sub_item_id: item.id,
            weight: item.weight_kg,
            catalog_barcode: item.scale_barcode, // Scale barcode
            scanned_barcode: barcodeToCheck, // Unified duplicate check field
            
            // Legacy/Standard fields
            // internal_code removed
            unit_type: 'un', 
        };

        addItem(cartItem);
        setSelectionOpen(false);
        setSelectedProduct(null);
        toast.success(`Item adicionado: ${catalogData.name}`);
    }, [selectedProduct, addItem, items]);

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
        // Expose helper to auto-add scanned product (bypassing selection if internal)
        handleScannedProduct: useCallback(async (product: ProductCatalog, overridePrice?: number, rawBarcode?: string) => {
             // If manual price override exists (scale barcode), we trust the scan
             if (overridePrice !== undefined) {
                 // Check for duplicate scan of the same specific item
                 const isDuplicate = rawBarcode && items.some((i: any) => {
                     if (i.scanned_barcode === rawBarcode) return true;
                     if (i.subItems && i.subItems.some((sub: any) => String(sub.barcode) === rawBarcode)) return true;
                     return false;
                 });

                 if (isDuplicate) {
                    toast.warning("Este item já foi adicionado ao pedido!");
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowPreview(false);
                    return;
                 }

                 const cartItem: any = {
                     id: product.id,
                     name: product.name,
                     base_price: overridePrice, // Use the price from the barcode
                     
                     // Internal Product Fields
                     is_internal: true,
                     catalog_id: product.id,
                     sub_item_id: null, // No specific sub-item ID from DB, but we have the specific scan
                     weight: product.unit_type === 'kg' && product.base_price > 0 
                        ? Number((overridePrice / product.base_price).toFixed(3)) 
                        : 1, // Estimate weight if possible
                     catalog_barcode: product.catalog_barcode,
                     scanned_barcode: rawBarcode, // Store for duplicate checking
                     
                     // internal_code removed
                     unit_type: product.unit_type,
                 };
                 
                 addItem(cartItem);
                 setSearchQuery("");
                 setSearchResults([]);
                 setShowPreview(false);
                 toast.success(`Item adicionado: ${product.name} (R$ ${overridePrice.toFixed(2)})`);
                 return;
             }

             // If no override, treat as normal select
             handleProductSelect(product);
        }, [addItem, handleProductSelect, items]),
        // Expose helper to open selection dialog from cart
        handleAddInternalItem: useCallback(async (catalogId: string) => {
             // We need to set selectedProduct to open the dialog.
             // We can try to find it in the search cache (unlikely) or fetch it.
             // For reliability, let's fetch it by ID.
             
             // Find the item in local cart which has the catalog data
             const cartItem = items.find(i => i.id === catalogId);
             if (cartItem) {
                 // Construct a ProductCatalog-like object from CartItem
                 const productCatalogForSelection = {
                     id: cartItem.id, // catalog_id
                     name: cartItem.name,
                     base_price: cartItem.base_price,
                     unit_type: cartItem.unit_type,
                     is_active: true,
                     is_internal: true,
                     catalog_barcode: cartItem.catalog_barcode
                 } as ProductCatalog;
                 
                 setSelectedProduct(productCatalogForSelection);
                 setSelectionOpen(true);
             } else {
                 // Fallback to fetch if not in cart (shouldn't happen for this flow)
                 const { data } = await searchProductCatalog(catalogId);
                 if (data && data.length > 0) {
                     setSelectedProduct(data[0]);
                     setSelectionOpen(true);
                 }
             }
        }, [items])
    };
}

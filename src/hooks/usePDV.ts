import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cartStore";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export function usePDV() {
    const { items, addItem, total, itemCount } = useCartStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ProductCatalog[]>([]);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
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
        const cartItem: any = {
            ...product,
        };
        addItem(cartItem);
        setSearchQuery("");
        setSearchResults([]);
        setShowPreview(false);
        toast.success(`Produto adicionado: ${product.name}`);
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
        performSearch
    };
}

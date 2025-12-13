import { useState, useCallback, useRef, useEffect } from "react";
import { searchProductCatalog, ProductCatalog } from "@/services/database/product-catalog";

export function useProductSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ProductCatalog[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

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
        if (query.length > 0) {
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

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchQuery);
        }, 150);
        return () => clearTimeout(timer);
    }, [searchQuery, performSearch]);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setShowPreview(false);
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        showPreview,
        setShowPreview,
        searchContainerRef,
        performSearch,
        clearSearch
    };
}

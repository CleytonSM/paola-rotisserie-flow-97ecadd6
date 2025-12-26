import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductCatalog } from "@/services/database/product-catalog";
import { CatalogLayout } from "@/components/layout/CatalogLayout";
import { CatalogProductCard } from "@/components/features/catalog/CatalogProductCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export function CatalogPage() {
    const [searchTerm, setSearchTerm] = React.useState("");

    const { data: result, isLoading } = useQuery({
        queryKey: ["product-catalog-public", searchTerm],
        queryFn: () => getProductCatalog("active", "all", searchTerm, 1, 100),
    });

    const allProducts = result?.data || [];

    // Logic: 
    // 1. is_active must be true (already filtered by query but enforced here for safety)
    // 2. If is_internal is true, show regardless of stock
    // 3. If is_internal is false, only show if quantity > 0
    const products = allProducts.filter(p =>
        p.is_active && (p.is_internal || (p.quantity && p.quantity > 0))
    );

    return (
        <CatalogLayout>
            {/* Hero Section */}
            <section className="bg-muted/30 py-12 md:py-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

                <div className="container relative z-10 text-center space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-display text-4xl md:text-6xl font-bold text-foreground"
                    >
                        Nosso Cardápio
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
                    >
                        Pratos artesanais preparados diariamente com ingredientes selecionados para você e sua família.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="max-w-md mx-auto relative group"
                    >
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar pratos..."
                            className="pl-12 h-14 text-lg rounded-full border-primary/10 bg-background shadow-lg shadow-primary/5 focus-visible:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </motion.div>
                </div>
            </section>

            {/* Product Grid */}
            <section className="container py-12 md:py-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <LoadingSpinner />
                        <p className="text-muted-foreground animate-pulse">Carregando delícias...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <CatalogProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-4">
                        <div className="bg-muted inline-flex p-6 rounded-full mb-4">
                            <Search className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Nenhum prato encontrado</h3>
                        <p className="text-muted-foreground">Tente buscar por termos diferentes ou navegue por todas as opções.</p>
                    </div>
                )}
            </section>
        </CatalogLayout>
    );
}

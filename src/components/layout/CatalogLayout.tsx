import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCatalogStore } from "@/stores/useCatalogStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CatalogCartDrawer } from "@/components/features/catalog/CatalogCartDrawer";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { StoreStatusBanner } from "@/components/features/catalog/StoreStatusBanner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const CatalogLayout = ({ children }: { children: React.ReactNode }) => {
    const itemCount = useCatalogStore((state) => state.itemCount());
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <ScrollToTop />
            {/* Branded Header */}
            <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
                <StoreStatusBanner />
                <div className="container flex h-20 items-center justify-between">
                    {/* Logo Section */}
                    <Link to="/cardapio" className="flex items-center">
                        <img
                            src="/pg-rotisserie-banner.png"
                            alt="Paola Gonçalves Rotisseria"
                            className="h-12 w-auto object-contain rounded-xl shadow-sm border border-border/10"
                        />
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex items-center gap-6">
                            <Link
                                to="/cardapio"
                                className={`font-medium text-sm transition-colors hover:text-primary ${location.pathname === '/cardapio' ? 'text-primary' : 'text-foreground'}`}
                            >
                                Cardápio
                            </Link>
                        </nav>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="relative gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                                    <ShoppingCart className="h-4 w-4 text-primary" />
                                    <span className="font-medium">Carrinho</span>
                                    {itemCount > 0 && (
                                        <Badge className="absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center px-1 bg-primary text-primary-foreground border-none">
                                            {itemCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0">
                                <CatalogCartDrawer />
                            </SheetContent>
                        </Sheet>

                        <ThemeToggle />
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex md:hidden items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative">
                                    <ShoppingCart className="h-6 w-6 text-primary" />
                                    {itemCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 bg-primary text-primary-foreground">
                                            {itemCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="p-0 w-full sm:max-w-md">
                                <CatalogCartDrawer />
                            </SheetContent>
                        </Sheet>

                        <ThemeToggle />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-border bg-card overflow-hidden"
                        >
                            <div className="container py-6 flex flex-col gap-4">
                                <Link
                                    to="/cardapio"
                                    className="text-lg font-medium px-4 py-2 rounded-lg hover:bg-muted"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Cardápio
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border py-12">
                <div className="container text-center">
                    <p className="font-display text-xl font-bold mb-2">Paola Gonçalves Rotisseria</p>
                    <p className="text-muted-foreground text-sm">Qualidade e tradição em cada prato.</p>
                </div>
            </footer>
        </div>
    );
};

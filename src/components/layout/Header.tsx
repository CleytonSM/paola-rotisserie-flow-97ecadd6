import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/services/auth";
import { toast } from "sonner";

// Componente interno para o link da navegação desktop com animação
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`relative px-1 py-2 font-sans text-sm font-medium transition-colors
        ${isActive ? "text-primary" : "text-foreground hover:text-primary-hover"}`}
    >
      {children}
      {/* ATUALIZADO: Underline animado orgânico para o item ATIVO */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
          layoutId="active-nav-underline"
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </Link>
  );
};

export const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao sair");
    } else {
      toast.success("Logout realizado");
      navigate("/auth");
    }
  };

  return (
    // ATUALIZADO: Fundo #FFFBF5 (bg-background), Borda #F0E6D2 (border-border)
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* ATUALIZADO: Logo de texto "Paola Gonçalves" com fonte Cormorant */}
        <Link to="/admin" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
          <span className="font-display text-2xl font-bold tracking-wide text-foreground">
            Paola Gonçalves
          </span>
        </Link>

        {/* Navegação Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/payable">Contas a Pagar</NavLink>
          <NavLink to="/admin/receivable">Contas a Receber</NavLink>
          <NavLink to="/admin/suppliers">Fornecedores</NavLink>
          <NavLink to="/admin/clients">Clientes</NavLink>
          <NavLink to="/admin/reports">Relatórios</NavLink>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="ml-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </nav>

        {/* Botão Menu Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Abrir menu"
        >
          {/* ATUALIZADO: Animação de girar para X */}
          <motion.div
            animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.div>
        </Button>
      </div>

      {/* Menu Mobile */}
      {/* ATUALIZADO: Animação de expandir (height) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="overflow-hidden md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t border-border bg-background py-4">
              <nav className="container flex flex-col gap-2">
                {[
                  { to: "/admin", label: "Dashboard" },
                  { to: "/admin/payable", label: "Contas a Pagar" },
                  { to: "/admin/receivable", label: "Contas a Receber" },
                  { to: "/admin/suppliers", label: "Fornecedores" },
                  { to: "/admin/clients", label: "Clientes" },
                  { to: "/admin/reports", label: "Relatórios" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-lg px-4 py-3 font-sans text-sm font-medium transition-colors
                      ${location.pathname === item.to
                        ? "bg-accent font-semibold text-primary" // Fundo #F8F4F0
                        : "text-foreground hover:bg-accent/50"
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start px-4 py-3 text-muted-foreground hover:bg-accent/50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { LogOut, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "@/services/auth";
import { toast } from "sonner";
import { useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo className="h-10" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/payable" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Contas a Pagar
          </Link>
          <Link 
            to="/receivable" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Contas a Receber
          </Link>
          <Link 
            to="/suppliers" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Fornecedores
          </Link>
          <Link 
            to="/clients" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Clientes
          </Link>
          <Link 
            to="/reports" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Relatórios
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSignOut}
            className="ml-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container flex flex-col gap-2 py-4">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/payable" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Contas a Pagar
            </Link>
            <Link 
              to="/receivable" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Contas a Receber
            </Link>
            <Link 
              to="/suppliers" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Fornecedores
            </Link>
            <Link 
              to="/clients" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Clientes
            </Link>
            <Link 
              to="/reports" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Relatórios
            </Link>
            <Button 
              variant="ghost"
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="justify-start px-4"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
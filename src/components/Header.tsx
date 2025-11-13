import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { LogOut, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "@/services/auth";
import { toast } from "sonner";
import { useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isSelectedClassName = "text-primary";
  const isNotSelectedClassName = "text-foreground hover:text-primary";
  
  const isActive = (path: string) => {
    return location.pathname === path;
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
            className={`text-sm font-medium transition-colors ${
              isActive("/") 
                ? isSelectedClassName
                : isNotSelectedClassName
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/payable" 
            className={`text-sm font-medium transition-colors ${
              isActive("/payable") 
                ? isSelectedClassName
                : isNotSelectedClassName
            }`}
          >
            Contas a Pagar
          </Link>
          <Link 
            to="/receivable" 
            className={`text-sm font-medium transition-colors ${
              isActive("/receivable") 
                ? isSelectedClassName
                : isNotSelectedClassName
            }`}
          >
            Contas a Receber
          </Link>
          <Link 
            to="/suppliers" 
            className={`text-sm font-medium transition-colors ${
              isActive("/suppliers") 
                ? isSelectedClassName
                : isNotSelectedClassName
            }`}
          >
            Fornecedores
          </Link>
          <Link 
            to="/clients" 
            className={`text-sm font-medium transition-colors ${
              isActive("/clients") 
                ? isSelectedClassName
                : isNotSelectedClassName
            }`}
          >
            Clientes
          </Link>
          <Link 
            to="/reports" 
            className={`text-sm font-medium transition-colors ${
              isActive("/reports") 
                ? isSelectedClassName
                : isNotSelectedClassName
            }`}
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
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/")
                  ? "bg-accent text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/payable" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/payable")
                  ? "bg-accent text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Contas a Pagar
            </Link>
            <Link 
              to="/receivable" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/receivable")
                  ? "bg-accent text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Contas a Receber
            </Link>
            <Link 
              to="/suppliers" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/suppliers")
                  ? "bg-accent text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Fornecedores
            </Link>
            <Link 
              to="/clients" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/clients")
                  ? "bg-accent text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              Clientes
            </Link>
            <Link 
              to="/reports" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive("/reports")
                  ? "bg-accent text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              }`}
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
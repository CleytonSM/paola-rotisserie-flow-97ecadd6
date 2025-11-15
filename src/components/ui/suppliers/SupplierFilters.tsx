import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SupplierFilters({ searchTerm, onSearchChange }: SupplierFiltersProps) {
  return (
    <div className="relative w-full md:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome, CNPJ, email..."
        className="pl-10"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}


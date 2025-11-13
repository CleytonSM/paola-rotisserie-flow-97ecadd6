import React, { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface FormField {
  key: string;
  label: string;
  type?: string;
  placeholder: string;
  required?: boolean;
  documentType?: "cpf" | "cnpj" | "cpf_cnpj"; // Tipo de documento para aplicar máscara
  phoneType?: boolean; // Indica se é campo de telefone
}

export interface EntityConfig<T extends { id: string; name: string } = { id: string; name: string }> {
  entityName: string;
  entityNamePlural: string;
  tableName: string;
  formFields: FormField[];
  getItems: () => Promise<{ data: T[] | null; error: Error | null }>;
  createItem: (data: Record<string, string>) => Promise<{ data: T | null; error: Error | null }>;
  renderItemDetails: (item: T) => React.ReactNode;
  getInitialFormData: () => Record<string, string>;
  getEmptyFormData: () => Record<string, string>;
  documentField?: string; // Campo para busca de documento (cpf_cnpj, cnpj, etc)
  errorMessages: {
    load: string;
    create: string;
    createSuccess: string;
    delete: string;
    deleteSuccess: string;
    nameRequired: string;
    documentIncomplete?: string; // Mensagem de erro para documento incompleto
    phoneIncomplete?: string; // Mensagem de erro para telefone incompleto
  };
}

interface EntityManagerProps<T extends { id: string; name: string }> {
  config: EntityConfig<T>;
  loading: boolean;
  items: T[];
  onLoad: () => void;
}

export function EntityManager<T extends { id: string; name: string }>({
  config,
  loading,
  items,
  onLoad,
}: EntityManagerProps<T>) {
  const [formData, setFormData] = useState<Record<string, string>>(
    config.getInitialFormData()
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Função para remover formatação de documentos (apenas números)
  const removeFormatting = (value: string): string => {
    return value.replace(/\D/g, "");
  };

  // Função para aplicar máscara de CPF
  const maskCPF = (value: string): string => {
    const numbers = removeFormatting(value);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Função para aplicar máscara de CNPJ
  const maskCNPJ = (value: string): string => {
    const numbers = removeFormatting(value);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  // Função para aplicar máscara de telefone brasileiro
  const maskPhone = (value: string): string => {
    const numbers = removeFormatting(value);
    if (numbers.length === 0) return "";
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
    // Telefone celular: (XX) 9XXXX-XXXX
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Função para aplicar máscara dinâmica (CPF ou CNPJ)
  const maskCPFOrCNPJ = (value: string): string => {
    const numbers = removeFormatting(value);
    // Se tiver mais de 11 dígitos, usa máscara de CNPJ
    if (numbers.length > 11) {
      return maskCNPJ(value);
    }
    // Caso contrário, usa máscara de CPF
    return maskCPF(value);
  };

  // Função para validar se o documento está completo
  const isDocumentComplete = (value: string, documentType?: "cpf" | "cnpj" | "cpf_cnpj"): boolean => {
    const numbers = removeFormatting(value);
    if (numbers.length === 0) return true; // Vazio é válido (não obrigatório)
    
    if (documentType === "cpf") {
      return numbers.length === 11;
    }
    if (documentType === "cnpj") {
      return numbers.length === 14;
    }
    if (documentType === "cpf_cnpj") {
      return numbers.length === 11 || numbers.length === 14;
    }
    return true; // Se não for campo de documento, sempre válido
  };

  // Função para validar se o telefone está completo
  const isPhoneComplete = (value: string): boolean => {
    const numbers = removeFormatting(value);
    if (numbers.length === 0) return true; // Vazio é válido (não obrigatório)
    // Telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular)
    return numbers.length === 10 || numbers.length === 11;
  };

  // Função para aplicar máscara baseada no tipo de documento
  const applyMask = (value: string, documentType?: "cpf" | "cnpj" | "cpf_cnpj"): string => {
    if (!documentType) return value;
    
    if (documentType === "cpf") {
      return maskCPF(value);
    }
    if (documentType === "cnpj") {
      return maskCNPJ(value);
    }
    if (documentType === "cpf_cnpj") {
      return maskCPFOrCNPJ(value);
    }
    return value;
  };

  // Handler para mudança de campo com máscara
  const handleFieldChange = (field: FormField, value: string) => {
    let maskedValue = value;
    
    // Se for campo de telefone, remove caracteres não numéricos primeiro
    if (field.phoneType) {
      // Remove tudo que não é número
      const numbersOnly = removeFormatting(value);
      maskedValue = maskPhone(numbersOnly);
    } else if (field.documentType) {
      // Aplica máscara se for campo de documento
      maskedValue = applyMask(value, field.documentType);
    }
    
    setFormData({ ...formData, [field.key]: maskedValue });
  };

  // Filtrar items baseado no termo de busca
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return items;
    }

    const term = searchTerm.trim().toLowerCase();
    const isNumericSearch = /^\d/.test(term);

    return items.filter((item) => {
      if (isNumericSearch && config.documentField) {
        // Busca por documento (CPF/CNPJ)
        const documentValue = (item as Record<string, unknown>)[config.documentField];
        if (documentValue && typeof documentValue === "string") {
          const cleanDocument = removeFormatting(documentValue);
          const cleanTerm = removeFormatting(term);
          return cleanDocument.includes(cleanTerm);
        }
        return false;
      } else {
        // Busca por nome
        return item.name.toLowerCase().includes(term);
      }
    });
  }, [items, searchTerm, config.documentField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error(config.errorMessages.nameRequired);
      return;
    }

    // Validar documentos - se começou a digitar, deve completar
    for (const field of config.formFields) {
      if (field.documentType) {
        const value = formData[field.key] || "";
        const numbers = removeFormatting(value);
        
        // Se começou a digitar mas não está completo
        if (numbers.length > 0 && !isDocumentComplete(value, field.documentType)) {
          const errorMsg = config.errorMessages.documentIncomplete || 
            `O ${field.label} está incompleto. Por favor, complete o documento ou deixe em branco.`;
          toast.error(errorMsg);
          return;
        }
      }
      
      // Validar telefone - se começou a digitar, deve completar
      if (field.phoneType) {
        const value = formData[field.key] || "";
        const numbers = removeFormatting(value);
        
        // Se começou a digitar mas não está completo
        if (numbers.length > 0 && !isPhoneComplete(value)) {
          const errorMsg = config.errorMessages.phoneIncomplete || 
            `O ${field.label} está incompleto. Por favor, complete o telefone ou deixe em branco.`;
          toast.error(errorMsg);
          return;
        }
      }
    }

    const result = await config.createItem(formData);

    if (result.error) {
      toast.error(config.errorMessages.create);
    } else {
      toast.success(config.errorMessages.createSuccess);
      setFormData(config.getEmptyFormData());
      onLoad();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from(config.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(config.errorMessages.delete);
    } else {
      toast.success(config.errorMessages.deleteSuccess);
      onLoad();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Novo {config.entityName}</CardTitle>
          <CardDescription>
            Adicione um novo {config.entityName.toLowerCase()} ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {config.formFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && "*"}
                </Label>
                <Input
                  id={field.key}
                  type={field.type || "text"}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  maxLength={
                    field.phoneType 
                      ? 15 // (99) 99999-9999 = 15 caracteres
                      : field.documentType === "cnpj" 
                        ? 18 
                        : field.documentType === "cpf" 
                          ? 14 
                          : field.documentType === "cpf_cnpj" 
                            ? 18 
                            : undefined
                  }
                />
              </div>
            ))}

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar {config.entityName}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{config.entityNamePlural} Cadastrados</CardTitle>
          <CardDescription>Lista de todos os {config.entityNamePlural.toLowerCase()}</CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && items.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={
                    config.documentField
                      ? "Buscar por nome ou documento..."
                      : "Buscar por nome..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-muted/50 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum {config.entityName.toLowerCase()} cadastrado
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum resultado encontrado para "{searchTerm}"
            </p>
          ) : (
            <div 
              className={`space-y-3 ${
                filteredItems.length > 3 
                  ? "max-h-[450px] overflow-y-auto pr-2" 
                  : ""
              }`}
            >
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    {config.renderItemDetails(item)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


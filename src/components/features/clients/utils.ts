// Validação de CPF/CNPJ
export const validateCpfCnpj = (doc: string) => {
  if (doc === "") return true; // Opcional
  const cleanDoc = doc.replace(/\D/g, "");
  return cleanDoc.length === 11 || cleanDoc.length === 14;
};

// Máscaras de formatação
export const maskCpfCnpj = (value: string | undefined) => {
  if (!value) return "N/A";
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (cleanValue.length === 14) {
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value; // Retorna o valor parcial se não estiver completo
};

export const maskPhone = (value: string | undefined) => {
  if (!value) return "N/A";
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
  return cleanValue
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

// Função para aplicar máscara de CPF/CNPJ em tempo real durante digitação
export const applyCpfCnpjMask = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  let maskedValue = value;

  if (cleanValue.length <= 11) {
    // Aplica máscara de CPF
    maskedValue = cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  } else {
    // Aplica máscara de CNPJ
    maskedValue = cleanValue
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }

  return maskedValue;
};

// Função para aplicar máscara de telefone em tempo real durante digitação
export const applyPhoneMask = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
  return cleanValue
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};


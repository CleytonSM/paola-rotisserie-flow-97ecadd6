export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatPhone = (value: string) => {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length === 11) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  if (clean.length >= 7) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  if (clean.length >= 3) {
    return clean.replace(/(\d{2})(\d)/, '($1) $2');
  }
  return clean;
};

export const applyCepMask = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
};

export const formatPixKey = (type: string, value: string) => {
  switch (type) {
    case 'cpf':
      return formatCPF(value);
    case 'cnpj':
      return formatCNPJ(value);
    case 'telefone':
      return formatPhone(value);
    default:
      return value;
  }
};

export const formatWeight = (value: string) => {
  // Remove anything that isn't a digit
  const clean = value.replace(/\D/g, "");
  if (!clean) return "0,000";
  
  // Convert to number and format with 3 decimal places
  const number = parseInt(clean, 10) / 1000;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

export const parseBrazilianNumber = (value: string): number => {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
};

export const applyCurrencyMask = (value: string) => {
  const numericValue = value.replace(/\D/g, "");
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(numericValue) / 100);
  
  return formattedValue;
};

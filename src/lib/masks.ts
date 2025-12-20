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
  const clean = value.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  if (clean.length === 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  // Handle +55 or other formats if needed, but for now basic 10/11 digit
  return value;
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

export const applyCurrencyMask = (value: string) => {
  const numericValue = value.replace(/\D/g, "");
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(numericValue) / 100);
  
  return formattedValue;
};

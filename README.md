# Paola Gonçalves Rotisserie - Sistema de Gestão Financeira

Sistema completo de gestão financeira para rotisseria, desenvolvido com React + Vite + Lovable Cloud.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS com design system personalizado
- **Backend**: Lovable Cloud (Supabase)
- **Validação**: Zod
- **Roteamento**: React Router v6
- **UI Components**: Shadcn/ui
- **Notificações**: Sonner

## 🎨 Design System

- **Cor Primária**: #FFC107 (Amarelo vibrante)
- **Cor Secundária**: #4CAF50 (Verde folha)
- **Tipografia**: 
  - Headers: Playfair Display
  - Body: Inter

## 📋 Funcionalidades

### ✅ Implementado

- **Autenticação**: Login e cadastro com email/senha
- **Dashboard**: Visão geral financeira dos últimos 7 dias
  - Saldo semanal
  - Total recebido/pago
  - Contas pendentes
- **Contas a Pagar**: 
  - Adicionar pagamentos
  - Vincular fornecedores
  - Marcar como pago
- **Contas a Receber**: 
  - Adicionar entradas
  - Busca de clientes por nome/CPF/CNPJ
  - Cálculo automático de taxas para cartão
- **Relatórios**: 
  - Visão completa do fluxo financeiro
  - Export PDF (em desenvolvimento)

## 🗄️ Banco de Dados

O sistema usa as seguintes tabelas:

- `suppliers` - Fornecedores
- `clients` - Clientes (com CPF/CNPJ)
- `accounts_payable` - Contas a pagar
- `accounts_receivable` - Contas a receber (com cálculo automático de net_value)
- `sales` - Vendas (hub para expansão futura)
- `purchases` - Compras (hub para expansão futura)
- `sales_items` - Itens de venda (preparado para futuro)
- `purchase_items` - Itens de compra (preparado para futuro)

## 🔒 Segurança

- Row Level Security (RLS) ativado em todas as tabelas
- Políticas de acesso para usuários autenticados
- Validação de entrada com Zod
- Auto-confirm email habilitado (para testes)

## 🏗️ Arquitetura

### Camada de Serviços Abstraída

Todo acesso ao backend está isolado em `/src/services`:

- **`database.ts`**: Abstração completa de queries/mutations
  - Expõe interfaces genéricas `DatabaseQuery<T>` e `DatabaseMutation<T>`
  - Implementação atual usa Supabase, mas pode ser trocada facilmente
  - Exemplo: `getSuppliers()`, `createAccountPayable()`, etc.

- **`auth.ts`**: Abstração de autenticação
  - Interface `AuthResult` genérica
  - Funções: `signIn()`, `signUp()`, `signOut()`, `getCurrentSession()`

### Por que essa arquitetura?

Esta estrutura permite **migração futura fácil** para backend dedicado:

```typescript
// Hoje (Supabase interno)
export const getSuppliers = async () => {
  const { data, error } = await supabase.from('suppliers').select('*');
  return { data, error };
};

// Amanhã (API externa - apenas trocar implementação)
export const getSuppliers = async () => {
  const response = await fetch('/api/suppliers');
  const data = await response.json();
  return { data, error: null };
};
```

**Nenhum componente conhece Supabase diretamente!**

## 🚀 Deploy

Este projeto está hospedado no Lovable. Para atualizar:

1. Edite o código via Lovable
2. Clique em "Publish" no canto superior direito
3. Suas mudanças estarão ao vivo!

## 📱 Responsividade

Interface 100% responsiva:
- Mobile-first design
- Menu hamburguer para navegação mobile
- Cards e tabelas adaptáveis

## 🔄 Próximos Passos

- [ ] Implementar export PDF com jsPDF
- [ ] Adicionar gráficos com Chart.js
- [ ] Sistema de produtos e estoque
- [ ] Notificações por email (Resend)
- [ ] Relatórios customizáveis

## 📄 Licença

Sistema desenvolvido para Paola Gonçalves Rotisserie.

---

**Bem-vindo à Paola Gonçalves Rotisserie** 🍰✨
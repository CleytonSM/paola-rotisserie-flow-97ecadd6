# Paola Gonçalves Rotisserie - Project Knowledge Base

> **Last Updated**: 2025-12-16  
> **Purpose**: This document serves as the **single source of truth** for the project's architecture, design system, database schema, and development guidelines. **All new components and features must align with the standards defined here.**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Design System](#design-system)
4. [Architecture & Code Organization](#architecture--code-organization)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Component Development Guidelines](#component-development-guidelines)
8. [Navigation Structure](#navigation-structure)
9. [Service Layer Abstraction](#service-layer-abstraction)
10. [Testing Strategy](#testing-strategy)
11. [Development Workflow](#development-workflow)
12. [Migration Strategy](#migration-strategy)

---

## 🎯 Project Overview

**Paola Gonçalves Rotisserie** is a complete financial management and Point of Sale (PDV) system for a rotisserie business, built with React + Vite + Supabase.

### Core Features
- ✅ **Authentication**: Email/password with role-based access control (Owner, Accountant, Viewer)
- ✅ **Dashboard**: 7-day financial overview with key metrics
- ✅ **PDV (Point of Sale)**: Complete sales workflow with barcode scanning, cart management, and payment processing
- ✅ **Sales History**: Comprehensive tracking of all completed sales
- ✅ **Accounts Payable**: Payment tracking with supplier management
- ✅ **Accounts Receivable**: Revenue tracking with client management and automatic card fee calculation
- ✅ **Reports**: Comprehensive financial flow analysis
- ✅ **Suppliers & Clients**: Full CRUD for business relationships
- ✅ **Machines**: Payment terminal/card machine management with card flags and tax rates
- ✅ **Pix Keys**: PIX key management with QR code generation
- ✅ **Product Catalog**: Master product management with base pricing, shelf life, and unit types (kg/un)
- ✅ **Product Items**: Individual item tracking (weighed/unit) with barcode generation and expiration monitoring
- ✅ **Partial Payments**: Support for multiple payment methods in a single transaction
- ✅ **Printer Integration**: Zebra printer support for labels

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18.3.1 + TypeScript 5.8.3
- **Build Tool**: Vite 7.2.2
- **Routing**: React Router v6.30.1
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **State Management**: 
  - TanStack Query (React Query) 5.83.0 for server state
  - Zustand 5.0.8 for local state (cart, PDV)
- **Form Handling**: React Hook Form 7.61.1 + Zod 3.23.8
- **Notifications**: Sonner 1.7.4 + Radix Toast
- **Animations**: Framer Motion 11.3.8
- **Charts**: Recharts 2.15.4
- **QR Code**: qrcode.react 4.2.0
- **Barcode Scanning**: html5-qrcode 2.3.8
- **Input Masking**: react-imask 7.6.1
- **Date Handling**: date-fns 3.6.0

### Backend
- **BaaS**: Supabase 2.81.1
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Row Level Security**: Enabled on all tables

### Testing
- **Unit Testing**: Vitest 4.0.15 + Testing Library
- **E2E Testing**: Playwright 1.57.0
- **Coverage**: @vitest/coverage-v8 4.0.15

### Development Tools
- **Linting**: ESLint 9.32.0
- **Package Manager**: npm (with bun.lockb present)
- **Deployment**: Vercel (vercel.json configured)

---

## 🎨 Design System

### Color Palette
**Theme**: Warm, classic, welcoming, and premium

#### Primary Colors
```css
/* Primary (CTAs): Warm golden-yellow */
--primary: #e5b35e (HSL: 38 72% 63%)
--primary-foreground: #1F2937 (dark text for high contrast)
--primary-hover: #e5b35e at 55% lightness

/* Secondary (Support): Olive green */
--secondary: #5DAB57 (HSL: 115 30% 51%)
--secondary-foreground: #FFFEFB (light text)
--secondary-hover: #559C4F

/* Tertiary (Classic Blue): Navy blue */
--tertiary: #000080 (HSL: 240 100% 25%)
--tertiary-foreground: #FFFFFF
--tertiary-hover: HSL 240 100% 20%
```

#### Neutral Colors
```css
/* Background: Cream */
--background: #FFFBF5 (HSL: 39 100% 98%)
--foreground: #2E2E2E (almost black)

/* Card/Popover: Off-white */
--card: #FFFEFB (HSL: 48 100% 99%)
--card-foreground: #2E2E2E

/* Muted (Inputs): Warm gray */
--muted: #F8F4F0 (HSL: 38 33% 95%)
--muted-foreground: #6B7280 (secondary text)

/* Border: Paper tone */
--border: #F0E6D2 (HSL: 40 48% 88%)
```

### Typography
```css
/* Body Text */
font-family: 'Satoshi', system-ui, sans-serif

/* Display/Headers */
font-family: 'Cormorant Garamond', serif
```

### Border Radius
```css
--radius: 1rem (16px)
--radius-md: calc(1rem - 4px)
--radius-sm: calc(1rem - 8px)
```

### Transitions
```css
--transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Design Principles
1. **Warm & Welcoming**: Use cream backgrounds and golden accents
2. **Premium Feel**: Rounded corners, smooth transitions, elegant typography
3. **High Contrast**: Ensure text readability with proper color combinations
4. **Consistent Spacing**: Use Tailwind's spacing scale
5. **Responsive First**: Mobile-first approach with adaptive layouts

---

## 🏗️ Architecture & Code Organization

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── features/       # Feature-specific components (13 domains)
│   │   ├── clients/       # Client management (4 files)
│   │   ├── dashboard/     # Dashboard widgets (8 files)
│   │   ├── machines/      # Machine management (4 files)
│   │   ├── partial-payment/ # Multi-payment support (2 files)
│   │   ├── payable/       # Accounts payable (5 files)
│   │   ├── pdv/           # Point of Sale (~20 files)
│   │   │   ├── payment/   # Payment flow components (8 files)
│   │   │   └── success/   # Success page components
│   │   ├── pix-keys/      # Pix key management (5 files)
│   │   ├── product-items/ # Item management (5 files)
│   │   ├── products/      # Product catalog (4 files)
│   │   ├── receivable/    # Accounts receivable (5 files)
│   │   ├── reports/       # Report components (9 files)
│   │   ├── sales/         # Sales history (3 files)
│   │   └── suppliers/     # Supplier management (6 files)
│   ├── icons/          # Custom icons (PixIcon)
│   ├── layout/         # Layout components (10 files)
│   │   ├── AppBreadcrumb.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   ├── NavLink.tsx
│   │   └── sidebar/    # Sidebar subcomponents (5 files)
│   └── ui/             # Shadcn/ui primitives (72 components)
├── pages/              # Route components
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Payable.tsx
│   ├── Receivable.tsx
│   ├── Reports.tsx
│   ├── Suppliers.tsx
│   ├── Clients.tsx
│   ├── Products.tsx
│   ├── ItemProducts.tsx
│   ├── Machines.tsx
│   ├── PixKeys.tsx
│   ├── Sales.tsx
│   ├── pdv/            # PDV flow pages
│   │   ├── PDVPage.tsx     # Main sales screen
│   │   ├── PaymentPage.tsx # Payment processing
│   │   └── SuccessPage.tsx # Transaction complete
│   └── NotFound.tsx
├── services/           # Backend abstraction layer
│   ├── auth.ts        # Authentication service
│   ├── database.ts    # Database service facade
│   ├── database/      # Specific database operations (15 modules)
│   │   ├── analytics.ts
│   │   ├── clients.ts
│   │   ├── machines.ts
│   │   ├── payable.ts
│   │   ├── pix_keys.ts
│   │   ├── product-catalog.ts
│   │   ├── product-items.ts
│   │   ├── product-stock.ts
│   │   ├── products.ts
│   │   ├── receivable.ts
│   │   ├── sales.ts
│   │   ├── suppliers.ts
│   │   ├── tokens.ts
│   │   └── types.ts
│   └── printer/       # Printer integration
│       ├── PrinterInterface.ts
│       ├── PrinterService.ts
│       └── ZebraPrinterStrategy.ts
├── hooks/              # Custom React hooks (25 files)
│   ├── useAuth.ts
│   ├── useBarcodeScanner.ts
│   ├── useClients.tsx
│   ├── useDashboard.tsx
│   ├── useMachines.ts
│   ├── usePDV.ts
│   ├── usePayable.ts
│   ├── usePayment.ts
│   ├── usePixKeys.ts
│   ├── useProductCatalog.ts
│   ├── useProductItems.ts
│   ├── useProductStock.ts
│   ├── useReceivable.ts
│   ├── useReports.ts
│   ├── useSales.tsx
│   ├── useScanner.ts
│   └── useSuppliers.ts
├── schemas/            # Zod validation schemas (10 files)
│   ├── auth.schema.ts
│   ├── client.schema.ts
│   ├── item.schema.ts
│   ├── machine.schema.ts
│   ├── payable.schema.ts
│   ├── pixKey.schema.ts
│   ├── product-catalog.schema.ts
│   ├── receivable.schema.ts
│   └── suppliers.schema.ts
├── stores/             # Zustand stores
│   └── (cart/pdv state)
├── types/              # TypeScript type definitions
│   ├── database.ts
│   ├── entities.ts
│   ├── filters.ts
│   ├── navigation.ts
│   └── index.ts
├── utils/              # Utility functions
│   ├── barcode.ts     # Barcode parsing/generation
│   ├── format.ts      # Currency/date formatting
│   ├── pix.ts         # PIX QR code generation
│   └── status.ts      # Status helpers
├── integrations/       # Third-party integrations (Supabase)
├── lib/                # Utility functions (utils.ts, cn helper)
├── config/             # App configuration
├── App.tsx             # Main app component with routing
├── main.tsx            # Entry point
├── navigationConfig.ts # Navigation structure
├── types.ts            # Global TypeScript types
└── index.css           # Global styles & CSS variables
```

### Key Architectural Patterns

#### 1. Service Layer Abstraction
**All backend interactions are isolated in `/src/services`**

```typescript
// ✅ CORRECT: Components use service layer
import { getSuppliers } from '@/services/database/suppliers';

// ❌ WRONG: Never import supabase directly in components
import { supabase } from '@/integrations/supabase/client';
```

**Why?** This allows easy migration to a dedicated backend in the future without touching component code.

#### 2. Feature-Based Component Organization
Components are now organized by feature domain rather than by type, making related code easier to find and maintain.

#### 3. Centralized State with Zustand
PDV/cart state is managed with Zustand for simpler, more performant local state management.

#### 4. Centralized Navigation
Navigation structure is defined in `navigationConfig.ts`.

---

## 🗄️ Database Schema

### Core Tables

#### `profiles`
User profile information
```sql
- id: UUID (PK, FK to auth.users)
- full_name: TEXT
- email: TEXT
- raw_user_meta_data: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `user_roles`
Role-based access control
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- role: app_role ENUM ('owner', 'accountant', 'viewer')
- created_at: TIMESTAMP
- UNIQUE(user_id, role)
```

#### `suppliers`
Supplier/vendor management
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- cnpj: VARCHAR(18)
- email: VARCHAR(255) UNIQUE
- phone: VARCHAR(20)
- created_at: TIMESTAMP
```

#### `clients`
Client management with tax ID validation
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- cpf_cnpj: VARCHAR(18) UNIQUE
- phone: VARCHAR(20)
- email: VARCHAR(255)
- created_at: TIMESTAMP
- CHECK: cpf_cnpj format (11 or 14 digits)
```

#### `accounts_payable`
Outgoing payments
```sql
- id: UUID (PK)
- supplier_id: UUID (FK to suppliers, nullable)
- value: DECIMAL(10,2)
- payment_date: TIMESTAMP
- payment_method: VARCHAR(50) DEFAULT 'cash'
- due_date: TIMESTAMP
- notes: TEXT
- status: VARCHAR(20) DEFAULT 'pending'
- created_at: TIMESTAMP
-- Trigger: auto-sets status to 'overdue' if past due_date
```

#### `accounts_receivable`
Incoming payments with automatic net value calculation
```sql
- id: UUID (PK)
- client_id: UUID (FK to clients, nullable)
- description: TEXT
- gross_value: DECIMAL(10,2)
- net_value: DECIMAL(10,2) -- auto-calculated by trigger
- tax_rate: DECIMAL(5,2)
- entry_date: TIMESTAMP
- payment_method: VARCHAR(50) DEFAULT 'cash'
- card_brand: VARCHAR(50)
- status: VARCHAR(20) DEFAULT 'received'
- created_at: TIMESTAMP
```

#### `receivable_payments`
Partial payment tracking for receivables
```sql
- id: UUID (PK)
- receivable_id: UUID (FK to accounts_receivable)
- amount: DECIMAL(10,2)
- payment_method: VARCHAR(50)
- card_brand: VARCHAR(50)
- tax_rate: DECIMAL(5,2) DEFAULT 0
- pix_key_id: UUID (FK to pix_keys)
- created_at: TIMESTAMP
```

#### `card_machines`
Payment terminal management
```sql
- id: UUID (PK)
- name: VARCHAR(255)
- image_url: VARCHAR(255)
- created_at: TIMESTAMP
```

#### `card_flags`
Card brand/type configuration per machine
```sql
- id: UUID (PK)
- machine_id: UUID (FK to card_machines)
- brand: VARCHAR(50)
- type: VARCHAR(20) -- 'credit' or 'debit'
- tax_rate: DECIMAL(5,2)
- created_at: TIMESTAMP
```

#### `pix_keys`
PIX key management
```sql
- id: UUID (PK)
- type: VARCHAR(20) -- 'aleatoria', 'telefone', 'cpf', 'cnpj', 'email'
- key_value: VARCHAR(255)
- active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
-- CHECK: validates key format based on type
```

#### `product_catalog`
Master product catalog (templates)
```sql
- id: UUID (PK)
- name: VARCHAR(100)
- base_price: DECIMAL(10,2)
- catalog_barcode: BIGINT
- shelf_life_days: INTEGER
- default_discount: DECIMAL(4,3) -- 0-1 range
- is_active: BOOLEAN DEFAULT true
- unit_type: TEXT DEFAULT 'kg' -- 'kg' or 'un'
- is_internal: BOOLEAN DEFAULT true -- manufactured internally
- quantity: INTEGER -- for non-internal products (stock count)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `product_item`
Individual weighed items/stock (for internal products)
```sql
- id: UUID (PK)
- catalog_id: UUID (FK to product_catalog)
- scale_barcode: BIGINT -- EAN-13 from scale
- produced_at: TIMESTAMP
- expires_at: TIMESTAMP -- auto-calculated from produced_at + shelf_life_days
- weight_kg: DECIMAL(8,3)
- sale_price: DECIMAL(10,2)
- item_discount: DECIMAL(4,3)
- status: TEXT DEFAULT 'available' -- 'available', 'sold', 'reserved', 'expired', 'discarded'
- sold_at: TIMESTAMP
- sale_id: UUID (FK to sales)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Sales Tables

#### `sales`
Sales hub with auto-incrementing display ID
```sql
- id: UUID (PK)
- display_id: BIGINT (auto-generated sequence)
- total_amount: DECIMAL(10,2)
- client_id: UUID (FK to clients)
- status: VARCHAR(20) DEFAULT 'completed' -- 'completed', 'cancelled', 'refunded'
- notes: TEXT
- change_amount: DECIMAL(10,2) DEFAULT 0
- created_at: TIMESTAMP
```

#### `sale_items`
Line items for sales
```sql
- id: UUID (PK)
- sale_id: UUID (FK to sales)
- product_catalog_id: UUID (FK to product_catalog)
- product_item_id: UUID (FK to product_item, nullable)
- name: VARCHAR(255)
- unit_price: DECIMAL(10,2)
- quantity: DECIMAL(10,3)
- total_price: DECIMAL(10,2)
- created_at: TIMESTAMP
```

#### `sale_payments`
Payment methods for sales
```sql
- id: UUID (PK)
- sale_id: UUID (FK to sales)
- amount: DECIMAL(10,2)
- payment_method: VARCHAR(50) -- 'pix', 'cash', 'card_credit', 'card_debit'
- pix_key_id: UUID (FK to pix_keys)
- machine_id: UUID (FK to card_machines)
- card_flag: VARCHAR(50)
- installments: INTEGER DEFAULT 1
- created_at: TIMESTAMP
```

### Database Functions

#### `complete_sale(p_sale_data, p_items_data, p_payments_data)`
Transactional function that:
1. Creates the sale record
2. Inserts sale items
3. Updates stock (marks product_items as 'sold' or decrements quantity)
4. Inserts sale payments
5. Creates accounts_receivable record
6. Creates receivable_payments for partial payments

#### `get_product_catalog_stock(catalog_id)`
Returns stock summary for a product catalog:
- total_items
- available_valid (not expired)
- available_expired
- sold, reserved, discarded counts

#### `get_all_catalog_stocks(catalog_ids)`
Batch version of stock query for multiple catalogs.

### Triggers
- `trg_calculate_net_value`: Auto-calculates net_value for card payments
- `trg_calculate_expiration`: Auto-calculates expires_at from produced_at
- `accounts_payable_update_status_trg`: Auto-sets 'overdue' status
- `trg_product_catalog_updated_at`: Updates timestamp
- `trg_product_item_updated_at`: Updates timestamp

---

## 🔒 Authentication & Authorization

### Authentication Flow
1. User signs up with email/password
2. Supabase creates user in `auth.users`
3. Trigger `handle_new_user()` creates profile in `profiles`
4. Owner manually assigns role in `user_roles` table

### Role Hierarchy
```
Owner > Accountant > Viewer
```

| Role | Permissions |
|------|------------|
| **Owner** | Full access to all features + user management |
| **Accountant** | Full access to financial data, clients, suppliers |
| **Viewer** | Read-only access to all data |

### RLS Implementation
All tables use Row Level Security with policies based on roles:

```sql
-- Example policy structure
CREATE POLICY "Owners and accountants full access"
ON table_name FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read"
ON table_name FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));
```

### Security Helper Functions
```sql
-- Check single role
public.has_role(user_id UUID, role app_role) RETURNS BOOLEAN

-- Check multiple roles
public.has_any_role(user_id UUID, roles app_role[]) RETURNS BOOLEAN
```

Both functions use `SECURITY DEFINER` to prevent RLS recursion.

---

## 🧩 Component Development Guidelines

### Before Creating a New Component

> ⚠️ **CRITICAL**: Always check if a similar component exists before creating a new one!

1. **Search existing components** in `src/components/features/`
2. **Review Shadcn/ui components** in `src/components/ui/`
3. **Check hooks** in `src/hooks/` for reusable logic
4. **Follow the design system** defined in this document

### Component Checklist

When creating a new component:

- [ ] **TypeScript**: Use proper typing, avoid `any`
- [ ] **Styling**: Use Tailwind classes aligned with design system colors
- [ ] **Responsiveness**: Mobile-first approach
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation
- [ ] **Error Handling**: Display user-friendly error messages
- [ ] **Loading States**: Show loading indicators for async operations
- [ ] **Validation**: Use Zod schemas (in `src/schemas/`)
- [ ] **Service Layer**: Never import Supabase directly, use service layer
- [ ] **Reusability**: Extract common logic into hooks or utilities
- [ ] **Documentation**: Add JSDoc comments for complex logic

### Form Development Pattern

```typescript
// 1. Define Zod schema in src/schemas/
const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  amount: z.number().positive("Valor deve ser positivo"),
});

// 2. Use React Hook Form
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});

// 3. Handle submission with service layer
const onSubmit = async (data: z.infer<typeof schema>) => {
  const { error } = await createEntity(data);
  if (error) {
    toast.error("Erro ao criar registro");
  } else {
    toast.success("Registro criado com sucesso!");
  }
};
```

### Naming Conventions

- **Components**: PascalCase (`EntityManager.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Services**: camelCase (`database.ts`)
- **Types**: PascalCase (`AccountPayable`)
- **Schemas**: camelCase with `.schema.ts` suffix (`client.schema.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)

---

## 🧭 Navigation Structure

Navigation is defined in `src/navigationConfig.ts`:

```typescript
export const navigationGroups = {
  overview: {
    label: "Geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "PDV", url: "/pdv", icon: ShoppingCart },
    ]
  },
  financial: {
    label: "Financeiro",
    items: [
      { title: "Contas a Receber", url: "/receivable", icon: ArrowUpCircle },
      { title: "Histórico de Vendas", url: "/sales", icon: BookOpen },
      { title: "Contas a Pagar", url: "/payable", icon: ArrowDownCircle },
      { title: "Relatórios", url: "/reports", icon: BarChart3 }
    ]
  },
  management: {
    label: "Gerenciamento",
    groups: [
      {
        title: "Cadastros",
        icon: Database,
        items: [
          { title: "Clientes", url: "/clients", icon: Users },
          { title: "Fornecedores", url: "/suppliers", icon: Truck },
          { title: "Produtos", url: "/products", icon: Package },
          { title: "Itens", url: "/product-items", icon: Tag },
        ]
      },
      {
        title: "Configurações",
        icon: Settings,
        items: [
          { title: "Maquininhas", url: "/machines", icon: CreditCard },
          { title: "Chaves Pix", url: "/pix-keys", icon: PixIcon },
        ]
      }
    ]
  }
};
```

### All Routes (App.tsx)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Main overview |
| `/auth` | Auth | Login/signup |
| `/pdv` | PDVPage | Point of sale |
| `/pdv/payment` | PaymentPage | Payment processing |
| `/pdv/success` | SuccessPage | Transaction complete |
| `/sales` | Sales | Sales history |
| `/receivable` | Receivable | Accounts receivable |
| `/payable` | Payable | Accounts payable |
| `/reports` | Reports | Financial reports |
| `/clients` | Clients | Client management |
| `/suppliers` | Suppliers | Supplier management |
| `/products` | Products | Product catalog |
| `/product-items` | ItemProducts | Product items |
| `/machines` | Machines | Card machine setup |
| `/pix-keys` | PixKeys | PIX key management |

---

## 🔌 Service Layer Abstraction

### Philosophy
**No component should know about Supabase directly.** This allows future migration to a dedicated API without touching component code.

### Service Structure

#### `src/services/auth.ts`
Authentication abstraction

#### `src/services/database.ts`
Database facade (re-exports from database/)

#### `src/services/database/[entity].ts`
Entity-specific operations (15 modules)

#### `src/services/printer/`
Printer integration with strategy pattern:
- `PrinterInterface.ts` - Abstract interface
- `PrinterService.ts` - Service facade
- `ZebraPrinterStrategy.ts` - Zebra printer implementation

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
Located in `src/__tests__/`

```bash
# Run unit tests
npm run test

# Run with UI
npm run test:ui

# Run once (CI)
npm run test:run

# With coverage
npm run test:coverage
```

### E2E Tests (Playwright)
Located in `e2e/` with 13 test specs:

| Spec File | Coverage |
|-----------|----------|
| `auth.setup.ts` | Authentication setup |
| `dashboard.spec.ts` | Dashboard page |
| `clients.spec.ts` | Client CRUD |
| `suppliers.spec.ts` | Supplier CRUD |
| `products.spec.ts` | Product catalog |
| `product-items.spec.ts` | Product items |
| `machines.spec.ts` | Card machines |
| `pix-keys.spec.ts` | PIX keys |
| `pdv.spec.ts` | Point of sale flow |
| `sales.spec.ts` | Sales history |
| `receivable.spec.ts` | Accounts receivable |
| `payable.spec.ts` | Accounts payable |
| `reports.spec.ts` | Reports |

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed

# Run all tests
npm run test:all
```

---

## 🔄 Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Database Migrations

Migrations are in `supabase/migrations/`. Currently using a consolidated v1 snapshot:
- `20251211183000_v1_snapshot.sql` - Complete schema snapshot

```bash
# Create new migration
supabase migration new <migration_name>

# Apply migrations
supabase db push

# Reset database (CAUTION!)
supabase db reset
```

### Migration Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

### Git Workflow
1. Create feature branch from `main`
2. Make changes
3. Run tests (`npm run test:all`)
4. Commit with descriptive message
5. Push and create PR
6. Deploy via Vercel on merge

---

## 📝 Development Best Practices

### DO ✅
- Use TypeScript strictly (no `any`)
- Follow the design system colors and spacing
- Use service layer for all backend operations
- Validate forms with Zod schemas in `src/schemas/`
- Handle loading and error states
- Write responsive, mobile-first code
- Use Shadcn/ui components when possible
- Add tests for new features
- Create migrations for database changes
- Test locally before committing

### DON'T ❌
- Import Supabase directly in components
- Create duplicate components without checking existing ones
- Use arbitrary colors outside the design system
- Skip form validation
- Ignore error handling
- Hard-code values that should be configurable
- Create overly complex components (keep them focused)
- Commit directly to `main`
- Skip migrations when changing database schema
- Skip tests

---

## 🎯 Roadmap

### Completed ✅
- Authentication with role-based access
- Dashboard with 7-day analytics
- Accounts payable/receivable management
- Supplier and client management (with CPF/CNPJ validation)
- Machine management with card flags
- Pix key management with QR code generation
- Reports with financial overview
- Product catalog with internal/external product types
- Product items with barcode scanning
- PDV with complete sales flow
- Partial payments support
- Sales history
- Printer integration (Zebra)
- E2E test coverage
- Server-side table filtering
- Money input formatting (Brazilian format)
- Stock deduction for sales

### In Progress 🚧
- PDF export for reports

### Planned 📋
- Charts and data visualization improvements
- Inventory management enhancements
- Email notifications (Resend)
- Customizable reports
- Purchase tracking
- Multi-currency support

---

## 📞 Support & Resources

### Documentation
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Playwright](https://playwright.dev/)
- [Vitest](https://vitest.dev/)

### Project-Specific
- **README**: `README.md` - Quick start guide
- **This Document**: `.agent/PROJECT_KNOWLEDGE_BASE.md` - Complete reference
- **Migrations**: `supabase/migrations/` - Database schema history

---

**Last Updated**: 2025-12-16  
**Maintained By**: Development Team  
**Version**: 2.0.0

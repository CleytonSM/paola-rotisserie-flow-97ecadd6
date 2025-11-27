# Paola Gonçalves Rotisserie - Project Knowledge Base

> **Last Updated**: 2025-11-25  
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
10. [Development Workflow](#development-workflow)
11. [Migration Strategy](#migration-strategy)

---

## 🎯 Project Overview

**Paola Gonçalves Rotisserie** is a complete financial management system for a rotisserie business, built with React + Vite + Supabase.

### Core Features
- ✅ **Authentication**: Email/password with role-based access control (Owner, Accountant, Viewer)
- ✅ **Dashboard**: 7-day financial overview with key metrics
- ✅ **Accounts Payable**: Payment tracking with supplier management
- ✅ **Accounts Receivable**: Revenue tracking with client management and automatic card fee calculation
- ✅ **Reports**: Comprehensive financial flow analysis
- ✅ **Suppliers & Clients**: Full CRUD for business relationships
- ✅ **Machines**: Payment terminal/card machine management
- ✅ **Product Catalog**: Master product management with base pricing and shelf life configuration
- ✅ **Product Items**: Individual item tracking (weighed/unit) with barcode generation and expiration monitoring

---

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18.3.1 + TypeScript 5.8.3
- **Build Tool**: Vite 7.2.2
- **Routing**: React Router v6.30.1
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query (React Query) 5.83.0
- **Form Handling**: React Hook Form 7.61.1 + Zod 4.1.12
- **Notifications**: Sonner 1.7.4
- **Animations**: Framer Motion 11.3.8

### Backend
- **BaaS**: Supabase 2.81.1
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Row Level Security**: Enabled on all tables

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
│   ├── ui/             # Shadcn/ui primitives (92 components)
│   ├── sidebar/        # Sidebar-specific components (5 files)
│   ├── AppSidebar.tsx
│   ├── EntityManager.tsx  # Generic CRUD component
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── Logo.tsx
│   ├── NavLink.tsx
│   └── StatsCard.tsx
├── pages/              # Route components
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Payable.tsx
│   ├── Receivable.tsx
│   ├── Reports.tsx
│   ├── Suppliers.tsx
│   ├── Clients.tsx
│   ├── Products.tsx
│   ├── Machines/       # Subdirectory for complex page
│   └── NotFound.tsx
├── services/           # Backend abstraction layer
│   ├── auth.ts        # Authentication service
│   ├── database.ts    # Database service facade
│   └── database/      # Specific database operations
│       ├── analytics.ts
│       ├── clients.ts
│       ├── machines.ts
│       ├── payable.ts
│       ├── receivable.ts
│       ├── suppliers.ts
│       ├── tokens.ts
│       └── types.ts
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
├── lib/                # Utility functions
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

#### 2. Generic Entity Manager
`EntityManager.tsx` is a reusable component for CRUD operations. Use it for new entities instead of creating custom forms from scratch.

#### 3. Centralized Navigation
Navigation structure is defined in `navigationConfig.ts` with three groups:
- **Overview**: Dashboard
- **Financial**: Receivable, Payable, Reports
- **Management**: Cadastros (Clients, Suppliers, Products) + Configurações (Machines, Settings)

---

## 🗄️ Database Schema

### Core Tables

#### `profiles`
User profile information
```sql
- id: UUID (PK, FK to auth.users)
- full_name: TEXT
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
- name: VARCHAR(100)
- contact: TEXT (phone/email)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `clients`
Client management with tax ID
```sql
- id: UUID (PK)
- name: VARCHAR(100)
- cpf_cnpj: VARCHAR(18) UNIQUE
- contact: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `accounts_payable`
Outgoing payments
```sql
- id: UUID (PK)
- description: VARCHAR(200)
- amount: DECIMAL(10,2)
- due_date: DATE
- paid_date: DATE (nullable)
- status: VARCHAR(20) DEFAULT 'pending'
- supplier_id: UUID (FK to suppliers, nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `accounts_receivable`
Incoming payments with automatic fee calculation
```sql
- id: UUID (PK)
- description: VARCHAR(200)
- gross_value: DECIMAL(10,2)
- fee_percentage: DECIMAL(5,2) DEFAULT 0
- net_value: DECIMAL(10,2) GENERATED ALWAYS AS (gross_value * (1 - fee_percentage/100))
- due_date: DATE
- received_date: DATE (nullable)
- status: VARCHAR(20) DEFAULT 'pending'
- is_overdue: BOOLEAN DEFAULT false
- client_id: UUID (FK to clients, nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `machines`
Payment terminal management
```sql
- id: UUID (PK)
- name: VARCHAR(100)
- brand: VARCHAR(50)
- model: VARCHAR(50)
- serial_number: VARCHAR(100) UNIQUE
- fee_percentage: DECIMAL(5,2)
- status: VARCHAR(20) DEFAULT 'active'
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `product_catalog`
Master product catalog (templates)
```sql
- id: UUID (PK)
- name: VARCHAR(100)
- base_price: DECIMAL(10,2)
- internal_code: VARCHAR(50) (nullable)
- catalog_barcode: BIGINT (nullable)
- shelf_life_days: INTEGER - Number of days product remains valid
- default_discount: DECIMAL(5,2) (nullable)
- is_active: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `product_item`
Individual weighed items/stock
```sql
- id: UUID (PK)
- catalog_id: UUID (FK to product_catalog)
- weight_kg: DECIMAL(10,3)
- price: DECIMAL(10,2)
- scale_barcode: VARCHAR(100) (nullable)
- manufactured_at: TIMESTAMP
- expires_at: TIMESTAMP
- status: ENUM ('available', 'sold', 'discarded', 'reserved')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Future Expansion Tables
These tables exist for future features:
- `sales` - Sales hub
- `purchases` - Purchase hub
- `sales_items` - Line items for sales
- `purchase_items` - Line items for purchases

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

1. **Search existing components** in `src/components/`
2. **Check if `EntityManager.tsx` can be reused** for CRUD operations
3. **Review Shadcn/ui components** in `src/components/ui/`
4. **Follow the design system** defined in this document

### Component Checklist

When creating a new component:

- [ ] **TypeScript**: Use proper typing, avoid `any`
- [ ] **Styling**: Use Tailwind classes aligned with design system colors
- [ ] **Responsiveness**: Mobile-first approach
- [ ] **Accessibility**: Proper ARIA labels, keyboard navigation
- [ ] **Error Handling**: Display user-friendly error messages
- [ ] **Loading States**: Show loading indicators for async operations
- [ ] **Validation**: Use Zod schemas for form validation
- [ ] **Service Layer**: Never import Supabase directly, use service layer
- [ ] **Reusability**: Extract common logic into hooks or utilities
- [ ] **Documentation**: Add JSDoc comments for complex logic

### Form Development Pattern

```typescript
// 1. Define Zod schema
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
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)

---

## 🧭 Navigation Structure

Navigation is defined in `src/navigationConfig.ts`:

```typescript
export const navigationGroups = {
  overview: {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard }
    ]
  },
  financial: {
    label: "Financeiro",
    items: [
      { title: "Contas a Receber", url: "/receivable", icon: ArrowUpCircle },
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
          { title: "Produtos", url: "/products", icon: Package }
        ]
      },
      {
        title: "Configurações",
        icon: Settings,
        items: [
          { title: "Maquininhas", url: "/machines", icon: CreditCard },
          { title: "Geral (Em breve)", url: "#", icon: Settings, disabled: true }
        ]
      }
    ]
  }
};
```

### Adding a New Route

1. **Create page component** in `src/pages/`
2. **Add route** in `src/App.tsx`
3. **Update navigation** in `src/navigationConfig.ts`
4. **Create migration** if database changes are needed

---

## 🔌 Service Layer Abstraction

### Philosophy
**No component should know about Supabase directly.** This allows future migration to a dedicated API without touching component code.

### Service Structure

#### `src/services/auth.ts`
Authentication abstraction
```typescript
export interface AuthResult {
  user: User | null;
  error: Error | null;
}

export const signIn = async (email: string, password: string): Promise<AuthResult>
export const signUp = async (email: string, password: string): Promise<AuthResult>
export const signOut = async (): Promise<void>
export const getCurrentSession = async (): Promise<Session | null>
```

#### `src/services/database.ts`
Database facade
```typescript
export interface DatabaseQuery<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseMutation<T> {
  data: T | null;
  error: Error | null;
}
```

#### `src/services/database/[entity].ts`
Entity-specific operations

Example: `src/services/database/suppliers.ts`
```typescript
export const getSuppliers = async (): Promise<DatabaseQuery<Supplier[]>>
export const createSupplier = async (supplier: SupplierInput): Promise<DatabaseMutation<Supplier>>
export const updateSupplier = async (id: string, supplier: SupplierInput): Promise<DatabaseMutation<Supplier>>
export const deleteSupplier = async (id: string): Promise<DatabaseMutation<void>>
```

### Migration Example

```typescript
// TODAY (Supabase)
export const getSuppliers = async () => {
  const { data, error } = await supabase.from('suppliers').select('*');
  return { data, error };
};

// TOMORROW (Dedicated API - only change implementation)
export const getSuppliers = async () => {
  const response = await fetch('/api/suppliers');
  const data = await response.json();
  return { data, error: null };
};
```

**Components remain unchanged!**

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

All migrations are in `supabase/migrations/`:

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

Example: `20251125114247_create_produtos_table.sql`

### Git Workflow
1. Create feature branch from `main`
2. Make changes
3. Test locally
4. Commit with descriptive message
5. Push and create PR
6. Deploy via Vercel on merge

---

## 🚀 Migration Strategy

### Future Backend Migration Plan

When migrating from Supabase to a dedicated backend:

#### Phase 1: API Development
1. Create REST API with same interface as service layer
2. Implement authentication endpoint
3. Implement CRUD endpoints for each entity
4. Add role-based middleware

#### Phase 2: Service Layer Update
1. Update `src/services/auth.ts` to call API
2. Update `src/services/database/*.ts` to call API
3. Keep interface signatures identical

#### Phase 3: Testing & Deployment
1. Test all features with new backend
2. Update environment variables
3. Deploy backend and frontend together
4. Monitor for issues

**No component changes required!** 🎉

---

## 📝 Development Best Practices

### DO ✅
- Use TypeScript strictly (no `any`)
- Follow the design system colors and spacing
- Use service layer for all backend operations
- Validate forms with Zod
- Handle loading and error states
- Write responsive, mobile-first code
- Use Shadcn/ui components when possible
- Add JSDoc comments for complex functions
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

---

## 🎯 Roadmap

### Completed ✅
- Authentication with role-based access
- Dashboard with 7-day analytics
- Accounts payable/receivable management
- Supplier and client management
- Machine management
- Reports with financial overview
- Products table and complete UI

### In Progress 🚧
- PDF export for reports

### Planned 📋
- Charts and data visualization
- Inventory management
- Email notifications (Resend)
- Customizable reports
- Sales and purchase tracking
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

### Project-Specific
- **README**: `README.md` - Quick start guide
- **This Document**: `.agent/PROJECT_KNOWLEDGE_BASE.md` - Complete reference
- **Migrations**: `supabase/migrations/` - Database schema history

---

**Last Updated**: 2025-11-25  
**Maintained By**: Development Team  
**Version**: 1.0.0

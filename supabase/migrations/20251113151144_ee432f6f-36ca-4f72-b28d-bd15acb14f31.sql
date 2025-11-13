-- ============================================
-- ROLE-BASED ACCESS CONTROL IMPLEMENTATION
-- ============================================
-- This migration implements a secure multi-user system with roles

-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'accountant', 'viewer');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Create helper function to check if user has any role
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- 5. Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can view all profiles but only update their own
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 6. Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Policy for user_roles table - users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Owners can manage all roles
CREATE POLICY "Owners can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'owner'));

-- ============================================
-- UPDATE RLS POLICIES FOR ALL TABLES
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users full access" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.purchases;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.sales_items;
DROP POLICY IF EXISTS "Authenticated users full access" ON public.purchase_items;

-- ACCOUNTS PAYABLE policies
CREATE POLICY "Owners and accountants full access to payables"
ON public.accounts_payable FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read payables"
ON public.accounts_payable FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- ACCOUNTS RECEIVABLE policies
CREATE POLICY "Owners and accountants full access to receivables"
ON public.accounts_receivable FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read receivables"
ON public.accounts_receivable FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- CLIENTS policies (contains PII - restrict more)
CREATE POLICY "Owners and accountants full access to clients"
ON public.clients FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read clients"
ON public.clients FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- SUPPLIERS policies
CREATE POLICY "Owners and accountants full access to suppliers"
ON public.suppliers FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read suppliers"
ON public.suppliers FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- SALES policies
CREATE POLICY "Owners and accountants full access to sales"
ON public.sales FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read sales"
ON public.sales FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- PURCHASES policies
CREATE POLICY "Owners and accountants full access to purchases"
ON public.purchases FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read purchases"
ON public.purchases FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- SALES_ITEMS policies
CREATE POLICY "Owners and accountants full access to sales_items"
ON public.sales_items FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read sales_items"
ON public.sales_items FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- PURCHASE_ITEMS policies
CREATE POLICY "Owners and accountants full access to purchase_items"
ON public.purchase_items FOR ALL
USING (public.has_any_role(auth.uid(), ARRAY['owner', 'accountant']::app_role[]));

CREATE POLICY "Viewers can read purchase_items"
ON public.purchase_items FOR SELECT
USING (public.has_role(auth.uid(), 'viewer'));

-- ============================================
-- INITIAL SETUP
-- ============================================
-- Note: The first user to sign up should be assigned the 'owner' role manually
-- in the Lovable Cloud Database UI or by running:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('<user_id>', 'owner');
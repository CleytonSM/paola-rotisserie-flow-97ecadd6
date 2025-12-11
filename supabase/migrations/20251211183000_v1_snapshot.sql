


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE "public"."app_role" AS ENUM (
            'owner',
            'accountant',
            'viewer'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Type app_role already exists';
END $$;


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accounts_payable_update_status_fn"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (NEW.status = 'pending') AND (NEW.due_date::date < current_date) THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."accounts_payable_update_status_fn"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_net_value"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.payment_method = 'card' AND NEW.tax_rate IS NOT NULL THEN
        NEW.net_value := NEW.gross_value * (1 - NEW.tax_rate / 100);
    ELSE
        NEW.net_value := NEW.gross_value;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_net_value"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_tokens"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW() OR revoked_at IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_sale"("p_sale_data" "jsonb", "p_items_data" "jsonb", "p_payments_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_sale_id UUID;
    v_display_id BIGINT;
    v_receivable_id UUID;
    v_item JSONB;
    v_payment JSONB;
    v_total_paid DECIMAL(10,2) := 0;
BEGIN
    -- 1. Insert Sale
    INSERT INTO public.sales (
        total_amount,
        client_id,
        notes,
        change_amount,
        status
    ) VALUES (
        (p_sale_data->>'total_amount')::DECIMAL,
        (p_sale_data->>'client_id')::UUID,
        p_sale_data->>'notes',
        COALESCE((p_sale_data->>'change_amount')::DECIMAL, 0),
        'completed'
    ) RETURNING id, display_id INTO v_sale_id, v_display_id;

    -- 2. Insert Sale Items & Update Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        INSERT INTO public.sale_items (
            sale_id,
            product_catalog_id,
            product_item_id,
            name,
            unit_price,
            quantity,
            total_price
        ) VALUES (
            v_sale_id,
            (v_item->>'product_catalog_id')::UUID,
            (v_item->>'product_item_id')::UUID,
            v_item->>'name',
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'quantity')::DECIMAL,
            (v_item->>'total_price')::DECIMAL
        );

        -- If specific item tracked (internal product), mark as sold
        IF (v_item->>'product_item_id') IS NOT NULL THEN
            UPDATE public.product_item
            SET status = 'sold',
                sold_at = CURRENT_TIMESTAMP,
                sale_id = v_sale_id
            WHERE id = (v_item->>'product_item_id')::UUID;
        ELSE
            -- For non-internal products (product_item_id is NULL), decrement catalog quantity
            UPDATE public.product_catalog
            SET quantity = COALESCE(quantity, 0) - (v_item->>'quantity')::INTEGER
            WHERE id = (v_item->>'product_catalog_id')::UUID
              AND quantity IS NOT NULL;
        END IF;
    END LOOP;

    -- 3. Insert Sale Payments & Calculate Accounts Receivable
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments_data)
    LOOP
        INSERT INTO public.sale_payments (
            sale_id,
            amount,
            payment_method,
            pix_key_id,
            machine_id,
            card_flag,
            installments
        ) VALUES (
            v_sale_id,
            (v_payment->>'amount')::DECIMAL,
            v_payment->>'payment_method',
            (v_payment->>'pix_key_id')::UUID,
            (v_payment->>'machine_id')::UUID,
            v_payment->>'card_flag',
            COALESCE((v_payment->>'installments')::INTEGER, 1)
        );

        v_total_paid := v_total_paid + (v_payment->>'amount')::DECIMAL;
    END LOOP;

    -- 4. Create Accounts Receivable Record
    -- Use 'multiple' if more than one payment method, otherwise use the single method
    INSERT INTO public.accounts_receivable (
        description,
        gross_value,
        tax_rate, 
        entry_date,
        status,
        client_id,
        payment_method
    ) VALUES (
        'Venda PDV #' || v_display_id::text,
        (p_sale_data->>'total_amount')::DECIMAL,
        0,
        CURRENT_TIMESTAMP,
        'received',
        (p_sale_data->>'client_id')::UUID,
        CASE 
            WHEN jsonb_array_length(p_payments_data) > 1 THEN 'multiple'
            ELSE (p_payments_data->0->>'payment_method')
        END
    ) RETURNING id INTO v_receivable_id;
    
    -- 5. Create Receivable Payments for partial payment tracking
    -- Only if there are multiple payments
    IF jsonb_array_length(p_payments_data) > 1 THEN
        FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments_data)
        LOOP
            INSERT INTO public.receivable_payments (
                receivable_id,
                amount,
                payment_method,
                card_brand,
                pix_key_id,
                tax_rate
            ) VALUES (
                v_receivable_id,
                (v_payment->>'amount')::DECIMAL,
                v_payment->>'payment_method',
                v_payment->>'card_flag', -- Use card_flag as card_brand
                (v_payment->>'pix_key_id')::UUID,
                0
            );
        END LOOP;
    END IF;
    
    RETURN jsonb_build_object('sale_id', v_sale_id, 'display_id', v_display_id);
END;
$$;


ALTER FUNCTION "public"."complete_sale"("p_sale_data" "jsonb", "p_items_data" "jsonb", "p_payments_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_catalog_stocks"("catalog_ids" "uuid"[]) RETURNS TABLE("catalog_id" "uuid", "catalog_name" "text", "total_items" bigint, "available_valid" bigint, "available_expired" bigint)
    LANGUAGE "sql" STABLE
    AS $$
    SELECT 
        pc.id                                      AS catalog_id,
        pc.name                                    AS catalog_name,
        
        -- Use quantity if set
        COALESCE(
            pc.quantity,
            COUNT(pi.id) FILTER (WHERE pi.status = 'available')
        )                                          AS total_items,
        
        -- Valid items logic
        CASE 
            WHEN pc.quantity IS NOT NULL THEN pc.quantity
            ELSE COUNT(pi.id) FILTER (WHERE 
                pi.status = 'available' 
                AND pi.expires_at >= NOW() AT TIME ZONE 'UTC'
            )
        END                                        AS available_valid,
        
        -- Expired items logic
        CASE 
            WHEN pc.quantity IS NOT NULL THEN 0
            ELSE COUNT(pi.id) FILTER (WHERE 
                pi.status = 'available' 
                AND pi.expires_at < NOW() AT TIME ZONE 'UTC'
            )
        END                                        AS available_expired
        
    FROM product_catalog pc
    LEFT JOIN product_item pi ON pi.catalog_id = pc.id
    WHERE (catalog_ids IS NULL OR pc.id = ANY(catalog_ids))
      AND pc.is_active = true
    GROUP BY pc.id, pc.name, pc.quantity;
$$;


ALTER FUNCTION "public"."get_all_catalog_stocks"("catalog_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_catalog_stock"("catalog_id" "uuid") RETURNS TABLE("catalog_id" "uuid", "catalog_name" "text", "total_items" bigint, "available_valid" bigint, "available_expired" bigint, "sold" bigint, "reserved" bigint, "discarded" bigint)
    LANGUAGE "sql" STABLE
    AS $$
    SELECT 
        pc.id                                      AS catalog_id,
        pc.name                                    AS catalog_name,
        
        -- If quantity is set, use it. Otherwise use count of items
        COALESCE(
            pc.quantity,
            COUNT(pi.id)
        )                                          AS total_items,
        
        -- For available_valid, if quantity is set, assume all are valid (simplification for external products)
        -- Or we could define 'available_valid' = quantity for external products
        CASE 
            WHEN pc.quantity IS NOT NULL THEN pc.quantity
            ELSE COUNT(pi.id) FILTER (WHERE 
                pi.status = 'available' 
                AND pi.expires_at >= NOW() AT TIME ZONE 'UTC'
            )
        END                                        AS available_valid,
        
        -- Expired count is 0 for external products (since we don't track their items individually)
        CASE 
            WHEN pc.quantity IS NOT NULL THEN 0
            ELSE COUNT(pi.id) FILTER (WHERE 
                pi.status = 'available' 
                AND pi.expires_at < NOW() AT TIME ZONE 'UTC'
            )
        END                                        AS available_expired,
        
        COUNT(pi.id) FILTER (WHERE pi.status = 'sold')        AS sold,
        COUNT(pi.id) FILTER (WHERE pi.status = 'reserved')    AS reserved,
        COUNT(pi.id) FILTER (WHERE pi.status = 'discarded')   AS discarded
        
    FROM product_catalog pc
    LEFT JOIN product_item pi ON pi.catalog_id = pc.id
    WHERE pc.id = get_product_catalog_stock.catalog_id
      AND pc.is_active = true
    GROUP BY pc.id, pc.name, pc.quantity;
$$;


ALTER FUNCTION "public"."get_product_catalog_stock"("catalog_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_any_role"("_user_id" "uuid", "_roles" "public"."app_role"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;


ALTER FUNCTION "public"."has_any_role"("_user_id" "uuid", "_roles" "public"."app_role"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_expiration_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.produced_at IS NOT NULL THEN
        SELECT (NEW.produced_at::date + shelf_life_days)::timestamptz + interval '23:59:59'
        INTO NEW.expires_at
        FROM product_catalog
        WHERE id = NEW.catalog_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_expiration_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_produtos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_produtos_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts_payable" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid",
    "value" numeric(10,2) NOT NULL,
    "payment_date" timestamp without time zone DEFAULT "now"(),
    "payment_method" character varying(50) DEFAULT 'cash'::character varying,
    "due_date" timestamp without time zone,
    "notes" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."accounts_payable" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts_receivable" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "gross_value" numeric(10,2) NOT NULL,
    "net_value" numeric(10,2) NOT NULL,
    "entry_date" timestamp without time zone NOT NULL,
    "payment_method" character varying(50) DEFAULT 'cash'::character varying,
    "card_brand" character varying(50),
    "tax_rate" numeric(5,2),
    "status" character varying(20) DEFAULT 'received'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "description" "text"
);


ALTER TABLE "public"."accounts_receivable" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "machine_id" "uuid" NOT NULL,
    "brand" character varying(50) NOT NULL,
    "type" character varying(20) NOT NULL,
    "tax_rate" numeric(5,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "card_flags_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['credit'::character varying, 'debit'::character varying])::"text"[])))
);


ALTER TABLE "public"."card_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."card_machines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "image_url" character varying(255),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."card_machines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "phone" character varying(20),
    "email" character varying(255),
    "cpf_cnpj" character varying(18),
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "chk_cpf_cnpj_format" CHECK ((("cpf_cnpj" IS NULL) OR (("cpf_cnpj")::"text" ~ '^\d{11}$|^\d{14}$'::"text")))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pix_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" character varying(20) NOT NULL,
    "key_value" character varying(255) NOT NULL,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "check_pix_key_format" CHECK (((("type")::"text" = 'aleatoria'::"text") OR ((("type")::"text" = 'telefone'::"text") AND (("key_value")::"text" ~ '^\+?[0-9]{12,14}$'::"text")) OR ((("type")::"text" = 'cpf'::"text") AND (("key_value")::"text" ~ '^[0-9]{11}$'::"text")) OR ((("type")::"text" = 'cnpj'::"text") AND (("key_value")::"text" ~ '^[0-9]{14}$'::"text")) OR ((("type")::"text" = 'email'::"text") AND (("key_value")::"text" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")))),
    CONSTRAINT "pix_keys_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['aleatoria'::character varying, 'telefone'::character varying, 'cpf'::character varying, 'cnpj'::character varying, 'email'::character varying])::"text"[])))
);


ALTER TABLE "public"."pix_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "base_price" numeric(10,2) NOT NULL,
    "catalog_barcode" bigint,
    "shelf_life_days" integer,
    "default_discount" numeric(4,3),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "unit_type" "text" DEFAULT 'kg'::"text" NOT NULL,
    "is_internal" boolean DEFAULT true,
    "quantity" integer,
    CONSTRAINT "product_catalog_base_price_check" CHECK (("base_price" >= (0)::numeric)),
    CONSTRAINT "product_catalog_default_discount_check" CHECK ((("default_discount" IS NULL) OR (("default_discount" >= (0)::numeric) AND ("default_discount" <= (1)::numeric)))),
    CONSTRAINT "product_catalog_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "product_catalog_shelf_life_days_check" CHECK ((("shelf_life_days" IS NULL) OR ("shelf_life_days" > 0))),
    CONSTRAINT "product_catalog_unit_type_check" CHECK (("unit_type" = ANY (ARRAY['kg'::"text", 'un'::"text"])))
);


ALTER TABLE "public"."product_catalog" OWNER TO "postgres";


COMMENT ON COLUMN "public"."product_catalog"."unit_type" IS 'Unit type for the product: kg (kilogram) or un (unit)';



COMMENT ON COLUMN "public"."product_catalog"."is_internal" IS 'Flag to indicate if the product is manufactured internally (e.g. rotisserie) and requires item selection';



CREATE TABLE IF NOT EXISTS "public"."product_item" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_id" "uuid" NOT NULL,
    "scale_barcode" bigint NOT NULL,
    "produced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "weight_kg" numeric(8,3) NOT NULL,
    "sale_price" numeric(10,2) NOT NULL,
    "item_discount" numeric(4,3),
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "sold_at" timestamp with time zone,
    "sale_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_item_item_discount_check" CHECK ((("item_discount" IS NULL) OR (("item_discount" >= (0)::numeric) AND ("item_discount" <= (1)::numeric)))),
    CONSTRAINT "product_item_sale_price_check" CHECK (("sale_price" >= (0)::numeric)),
    CONSTRAINT "product_item_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'sold'::"text", 'reserved'::"text", 'expired'::"text", 'discarded'::"text"]))),
    CONSTRAINT "product_item_weight_kg_check" CHECK (("weight_kg" > (0)::numeric))
);


ALTER TABLE "public"."product_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "raw_user_meta_data" "jsonb",
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "input_id" "uuid",
    "quantity" integer NOT NULL,
    "unit_price" numeric(8,2) NOT NULL,
    "subtotal" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."purchase_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "accounts_payable_id" "uuid",
    "supplier_id" "uuid",
    "purchase_date" timestamp without time zone DEFAULT "now"(),
    "total_items" integer DEFAULT 0
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receivable_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "receivable_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "card_brand" character varying(50),
    "tax_rate" numeric(5,2) DEFAULT 0,
    "pix_key_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."receivable_payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."receivable_payments" IS 'Stores multiple payment methods for a single accounts receivable entry (partial payments)';



CREATE TABLE IF NOT EXISTS "public"."refresh_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "expires_at" timestamp without time zone NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "revoked_at" timestamp without time zone,
    "device_info" "text",
    "ip_address" "inet"
);


ALTER TABLE "public"."refresh_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid",
    "product_catalog_id" "uuid",
    "product_item_id" "uuid",
    "name" character varying(255) NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "quantity" numeric(10,3) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sale_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "payment_method" character varying(50) NOT NULL,
    "pix_key_id" "uuid",
    "machine_id" "uuid",
    "card_flag" character varying(50),
    "installments" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "sale_payments_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['pix'::character varying, 'cash'::character varying, 'card_credit'::character varying, 'card_debit'::character varying])::"text"[])))
);


ALTER TABLE "public"."sale_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "client_id" "uuid",
    "status" character varying(20) DEFAULT 'completed'::character varying,
    "notes" "text",
    "change_amount" numeric(10,2) DEFAULT 0,
    CONSTRAINT "sales_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['completed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::"text"[])))
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


ALTER TABLE "public"."sales" ALTER COLUMN "display_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."sales_display_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "cnpj" character varying(18),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "email" character varying(255),
    "phone" character varying(20)
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts_payable"
    ADD CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_flags"
    ADD CONSTRAINT "card_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."card_machines"
    ADD CONSTRAINT "card_machines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_cpf_cnpj_key" UNIQUE ("cpf_cnpj");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pix_keys"
    ADD CONSTRAINT "pix_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_catalog"
    ADD CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_item"
    ADD CONSTRAINT "product_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_accounts_payable_id_key" UNIQUE ("accounts_payable_id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receivable_payments"
    ADD CONSTRAINT "receivable_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_payments"
    ADD CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE INDEX "idx_accounts_payable_supplier" ON "public"."accounts_payable" USING "btree" ("supplier_id");



CREATE INDEX "idx_accounts_receivable_client" ON "public"."accounts_receivable" USING "btree" ("client_id");



CREATE INDEX "idx_card_flags_machine_id" ON "public"."card_flags" USING "btree" ("machine_id");



CREATE INDEX "idx_pix_keys_active" ON "public"."pix_keys" USING "btree" ("active");



CREATE INDEX "idx_product_catalog_active" ON "public"."product_catalog" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_product_catalog_barcode" ON "public"."product_catalog" USING "btree" ("catalog_barcode");



CREATE INDEX "idx_product_item_available_expiring" ON "public"."product_item" USING "btree" ("expires_at") WHERE ("status" = 'available'::"text");



CREATE INDEX "idx_product_item_catalog" ON "public"."product_item" USING "btree" ("catalog_id");



CREATE INDEX "idx_product_item_expires" ON "public"."product_item" USING "btree" ("expires_at");



CREATE INDEX "idx_product_item_scale_barcode" ON "public"."product_item" USING "btree" ("scale_barcode");



CREATE INDEX "idx_product_item_status" ON "public"."product_item" USING "btree" ("status");



CREATE INDEX "idx_purchases_supplier_id" ON "public"."purchases" USING "btree" ("supplier_id");



CREATE INDEX "idx_receivable_payments_pix_key_id" ON "public"."receivable_payments" USING "btree" ("pix_key_id");



CREATE INDEX "idx_receivable_payments_receivable_id" ON "public"."receivable_payments" USING "btree" ("receivable_id");



CREATE INDEX "idx_refresh_tokens_expires_at" ON "public"."refresh_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_refresh_tokens_revoked_at" ON "public"."refresh_tokens" USING "btree" ("revoked_at") WHERE ("revoked_at" IS NULL);



CREATE INDEX "idx_refresh_tokens_token_hash" ON "public"."refresh_tokens" USING "btree" ("token_hash");



CREATE INDEX "idx_refresh_tokens_user_id" ON "public"."refresh_tokens" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "accounts_payable_update_status_trg" BEFORE INSERT OR UPDATE ON "public"."accounts_payable" FOR EACH ROW EXECUTE FUNCTION "public"."accounts_payable_update_status_fn"();



CREATE OR REPLACE TRIGGER "trg_calculate_expiration" BEFORE INSERT OR UPDATE ON "public"."product_item" FOR EACH ROW EXECUTE FUNCTION "public"."set_expiration_date"();



CREATE OR REPLACE TRIGGER "trg_calculate_net_value" BEFORE INSERT OR UPDATE ON "public"."accounts_receivable" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_net_value"();



CREATE OR REPLACE TRIGGER "trg_product_catalog_updated_at" BEFORE UPDATE ON "public"."product_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_product_item_updated_at" BEFORE UPDATE ON "public"."product_item" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."accounts_payable"
    ADD CONSTRAINT "accounts_payable_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."card_flags"
    ADD CONSTRAINT "card_flags_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."card_machines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_item"
    ADD CONSTRAINT "product_item_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."product_catalog"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "public"."accounts_payable"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receivable_payments"
    ADD CONSTRAINT "receivable_payments_pix_key_id_fkey" FOREIGN KEY ("pix_key_id") REFERENCES "public"."pix_keys"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receivable_payments"
    ADD CONSTRAINT "receivable_payments_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "public"."accounts_receivable"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_catalog_id_fkey" FOREIGN KEY ("product_catalog_id") REFERENCES "public"."product_catalog"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_item_id_fkey" FOREIGN KEY ("product_item_id") REFERENCES "public"."product_item"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_payments"
    ADD CONSTRAINT "sale_payments_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."card_machines"("id");



ALTER TABLE ONLY "public"."sale_payments"
    ADD CONSTRAINT "sale_payments_pix_key_id_fkey" FOREIGN KEY ("pix_key_id") REFERENCES "public"."pix_keys"("id");



ALTER TABLE ONLY "public"."sale_payments"
    ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated full access catalog" ON "public"."product_catalog" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated full access items" ON "public"."product_item" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."card_flags" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."card_machines" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."pix_keys" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read/write for auth users" ON "public"."receivable_payments" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read/write for auth users" ON "public"."sale_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read/write for auth users" ON "public"."sale_payments" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read/write for auth users" ON "public"."sales" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Owners and accountants full access to clients" ON "public"."clients" USING ("public"."has_any_role"("auth"."uid"(), ARRAY['owner'::"public"."app_role", 'accountant'::"public"."app_role"]));



CREATE POLICY "Owners and accountants full access to payables" ON "public"."accounts_payable" USING ("public"."has_any_role"("auth"."uid"(), ARRAY['owner'::"public"."app_role", 'accountant'::"public"."app_role"]));



CREATE POLICY "Owners and accountants full access to purchase_items" ON "public"."purchase_items" USING ("public"."has_any_role"("auth"."uid"(), ARRAY['owner'::"public"."app_role", 'accountant'::"public"."app_role"]));



CREATE POLICY "Owners and accountants full access to purchases" ON "public"."purchases" USING ("public"."has_any_role"("auth"."uid"(), ARRAY['owner'::"public"."app_role", 'accountant'::"public"."app_role"]));



CREATE POLICY "Owners and accountants full access to receivables" ON "public"."accounts_receivable" USING ("public"."has_any_role"("auth"."uid"(), ARRAY['owner'::"public"."app_role", 'accountant'::"public"."app_role"]));



CREATE POLICY "Owners and accountants full access to suppliers" ON "public"."suppliers" USING ("public"."has_any_role"("auth"."uid"(), ARRAY['owner'::"public"."app_role", 'accountant'::"public"."app_role"]));



CREATE POLICY "Owners can manage all roles" ON "public"."user_roles" USING ("public"."has_role"("auth"."uid"(), 'owner'::"public"."app_role"));



CREATE POLICY "Users can insert own refresh tokens" ON "public"."refresh_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own refresh tokens" ON "public"."refresh_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own refresh tokens" ON "public"."refresh_tokens" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Viewers can read clients" ON "public"."clients" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'viewer'::"public"."app_role"));



CREATE POLICY "Viewers can read payables" ON "public"."accounts_payable" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'viewer'::"public"."app_role"));



CREATE POLICY "Viewers can read purchase_items" ON "public"."purchase_items" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'viewer'::"public"."app_role"));



CREATE POLICY "Viewers can read purchases" ON "public"."purchases" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'viewer'::"public"."app_role"));



CREATE POLICY "Viewers can read receivables" ON "public"."accounts_receivable" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'viewer'::"public"."app_role"));



CREATE POLICY "Viewers can read suppliers" ON "public"."suppliers" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'viewer'::"public"."app_role"));



ALTER TABLE "public"."accounts_payable" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."card_machines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pix_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_item" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receivable_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accounts_payable_update_status_fn"() TO "anon";
GRANT ALL ON FUNCTION "public"."accounts_payable_update_status_fn"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."accounts_payable_update_status_fn"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_net_value"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_net_value"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_net_value"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_tokens"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_sale"("p_sale_data" "jsonb", "p_items_data" "jsonb", "p_payments_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_sale"("p_sale_data" "jsonb", "p_items_data" "jsonb", "p_payments_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_sale"("p_sale_data" "jsonb", "p_items_data" "jsonb", "p_payments_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_catalog_stocks"("catalog_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_catalog_stocks"("catalog_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_catalog_stocks"("catalog_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_catalog_stock"("catalog_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_catalog_stock"("catalog_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_catalog_stock"("catalog_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_any_role"("_user_id" "uuid", "_roles" "public"."app_role"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."has_any_role"("_user_id" "uuid", "_roles" "public"."app_role"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_any_role"("_user_id" "uuid", "_roles" "public"."app_role"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_expiration_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_expiration_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_expiration_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_produtos_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_produtos_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_produtos_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."accounts_payable" TO "anon";
GRANT ALL ON TABLE "public"."accounts_payable" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts_payable" TO "service_role";



GRANT ALL ON TABLE "public"."accounts_receivable" TO "anon";
GRANT ALL ON TABLE "public"."accounts_receivable" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts_receivable" TO "service_role";



GRANT ALL ON TABLE "public"."card_flags" TO "anon";
GRANT ALL ON TABLE "public"."card_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."card_flags" TO "service_role";



GRANT ALL ON TABLE "public"."card_machines" TO "anon";
GRANT ALL ON TABLE "public"."card_machines" TO "authenticated";
GRANT ALL ON TABLE "public"."card_machines" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."pix_keys" TO "anon";
GRANT ALL ON TABLE "public"."pix_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."pix_keys" TO "service_role";



GRANT ALL ON TABLE "public"."product_catalog" TO "anon";
GRANT ALL ON TABLE "public"."product_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."product_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."product_item" TO "anon";
GRANT ALL ON TABLE "public"."product_item" TO "authenticated";
GRANT ALL ON TABLE "public"."product_item" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."receivable_payments" TO "anon";
GRANT ALL ON TABLE "public"."receivable_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."receivable_payments" TO "service_role";



GRANT ALL ON TABLE "public"."refresh_tokens" TO "anon";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON TABLE "public"."sale_payments" TO "anon";
GRANT ALL ON TABLE "public"."sale_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_payments" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sales_display_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sales_display_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sales_display_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































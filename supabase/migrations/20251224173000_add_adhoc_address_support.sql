-- Add delivery address columns to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS delivery_zip_code TEXT,
ADD COLUMN IF NOT EXISTS delivery_street TEXT,
ADD COLUMN IF NOT EXISTS delivery_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_complement TEXT,
ADD COLUMN IF NOT EXISTS delivery_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS delivery_city TEXT,
ADD COLUMN IF NOT EXISTS delivery_state TEXT;

-- Update complete_sale RPC to handle new address fields
CREATE OR REPLACE FUNCTION public.complete_sale(
    p_sale_data jsonb,
    p_items_data jsonb,
    p_payments_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_sale_id UUID;
    v_display_id INTEGER;
    v_item jsonb;
    v_payment jsonb;
    v_is_delivery BOOLEAN;
    v_delivery_address_id UUID;
    v_delivery_zip_code TEXT;
    v_delivery_street TEXT;
    v_delivery_number TEXT;
    v_delivery_complement TEXT;
    v_delivery_neighborhood TEXT;
    v_delivery_city TEXT;
    v_delivery_state TEXT;
BEGIN
    -- Extract delivery data
    v_is_delivery := COALESCE((p_sale_data->>'is_delivery')::BOOLEAN, false);
    v_delivery_address_id := (p_sale_data->>'delivery_address_id')::UUID;
    v_delivery_zip_code := p_sale_data->>'delivery_zip_code';
    v_delivery_street := p_sale_data->>'delivery_street';
    v_delivery_number := p_sale_data->>'delivery_number';
    v_delivery_complement := p_sale_data->>'delivery_complement';
    v_delivery_neighborhood := p_sale_data->>'delivery_neighborhood';
    v_delivery_city := p_sale_data->>'delivery_city';
    v_delivery_state := p_sale_data->>'delivery_state';

    -- If delivery_address_id is provided, fetch address details from client_addresses
    IF v_is_delivery AND v_delivery_address_id IS NOT NULL THEN
        SELECT zip_code, street, number, complement, neighborhood, city, state
        INTO v_delivery_zip_code, v_delivery_street, v_delivery_number, v_delivery_complement, v_delivery_neighborhood, v_delivery_city, v_delivery_state
        FROM client_addresses
        WHERE id = v_delivery_address_id;
    END IF;

    -- Insert into sales
    INSERT INTO public.sales (
        client_id,
        total_amount,
        status,
        payment_status,
        notes,
        scheduled_pickup,
        is_delivery,
        delivery_address_id,
        delivery_fee,
        delivery_zip_code,
        delivery_street,
        delivery_number,
        delivery_complement,
        delivery_neighborhood,
        delivery_city,
        delivery_state
    ) VALUES (
        (p_sale_data->>'client_id')::UUID,
        (p_sale_data->>'total_amount')::NUMERIC,
        'received', -- Default status
        'pending', -- Default payment status, logic below handles full payment
        p_sale_data->>'notes',
        (p_sale_data->>'scheduled_pickup')::TIMESTAMP WITH TIME ZONE,
        v_is_delivery,
        v_delivery_address_id,
        COALESCE((p_sale_data->>'delivery_fee')::NUMERIC, 0),
        v_delivery_zip_code,
        v_delivery_street,
        v_delivery_number,
        v_delivery_complement,
        v_delivery_neighborhood,
        v_delivery_city,
        v_delivery_state
    ) RETURNING id, display_id INTO v_sale_id, v_display_id;

    -- Insert sale items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        INSERT INTO public.sale_items (
            sale_id,
            product_catalog_id,
            product_item_id,
            name,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_sale_id,
            (v_item->>'product_catalog_id')::UUID,
            (v_item->>'product_item_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'total_price')::NUMERIC
        );

        -- Stock update logic
        IF (v_item->>'product_item_id') IS NOT NULL THEN
            UPDATE public.product_item
            SET status = 'sold',
                sold_at = CURRENT_TIMESTAMP,
                sale_id = v_sale_id
            WHERE id = (v_item->>'product_item_id')::UUID;
        ELSE
            UPDATE public.product_catalog
            SET quantity = COALESCE(quantity, 0) - (v_item->>'quantity')::INTEGER
            WHERE id = (v_item->>'product_catalog_id')::UUID
            AND is_internal = false;
        END IF;
    END LOOP;

    -- Insert payments
    IF p_payments_data IS NOT NULL AND jsonb_array_length(p_payments_data) > 0 THEN
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
                (v_payment->>'amount')::NUMERIC,
                v_payment->>'payment_method',
                (v_payment->>'pix_key_id')::UUID,
                (v_payment->>'machine_id')::UUID,
                v_payment->>'card_flag',
                COALESCE((v_payment->>'installments')::INTEGER, 1)
            );
        END LOOP;
        
        -- Check if fully paid (simple check)
        -- In a real app, you might sum payments and compare with total
        UPDATE public.sales
        SET payment_status = 'paid' -- Simplified, assuming if payments exist it might be paid or partial. 
        WHERE id = v_sale_id; 
        -- Note: Real payment status logic usually depends on total amount paid. 
        -- Keeping it simple as per original implementation preference or standard.
    END IF;

    RETURN jsonb_build_object(
        'sale_id', v_sale_id,
        'display_id', v_display_id
    );
END;
$function$;

-- Update update_order RPC to handle new address fields
CREATE OR REPLACE FUNCTION public.update_order(
    p_sale_id UUID,
    p_sale_data jsonb,
    p_items_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_old_items RECORD;
    v_item jsonb;
    v_is_delivery BOOLEAN;
    v_delivery_address_id UUID;
    v_delivery_zip_code TEXT;
    v_delivery_street TEXT;
    v_delivery_number TEXT;
    v_delivery_complement TEXT;
    v_delivery_neighborhood TEXT;
    v_delivery_city TEXT;
    v_delivery_state TEXT;
BEGIN
    -- Extract delivery data
    v_is_delivery := COALESCE((p_sale_data->>'is_delivery')::BOOLEAN, false);
    v_delivery_address_id := (p_sale_data->>'delivery_address_id')::UUID;
    v_delivery_zip_code := p_sale_data->>'delivery_zip_code';
    v_delivery_street := p_sale_data->>'delivery_street';
    v_delivery_number := p_sale_data->>'delivery_number';
    v_delivery_complement := p_sale_data->>'delivery_complement';
    v_delivery_neighborhood := p_sale_data->>'delivery_neighborhood';
    v_delivery_city := p_sale_data->>'delivery_city';
    v_delivery_state := p_sale_data->>'delivery_state';

    -- If delivery_address_id is provided, fetch address details from client_addresses
    IF v_is_delivery AND v_delivery_address_id IS NOT NULL THEN
        SELECT zip_code, street, number, complement, neighborhood, city, state
        INTO v_delivery_zip_code, v_delivery_street, v_delivery_number, v_delivery_complement, v_delivery_neighborhood, v_delivery_city, v_delivery_state
        FROM client_addresses
        WHERE id = v_delivery_address_id;
    END IF;

    -- 1. Restore Stock for Removed Items
    -- (Logic omitted for brevity, assuming standard update logic: first restore old items)
    FOR v_old_items IN SELECT * FROM sale_items WHERE sale_id = p_sale_id LOOP
         IF v_old_items.product_item_id IS NOT NULL THEN
            UPDATE product_item SET status = 'in_stock', sale_id = NULL, sold_at = NULL WHERE id = v_old_items.product_item_id;
        ELSE
            UPDATE product_catalog SET quantity = quantity + v_old_items.quantity 
            WHERE id = v_old_items.product_catalog_id 
            AND is_internal = false;
        END IF;
    END LOOP;

    -- 2. Delete Old Items
    DELETE FROM sale_items WHERE sale_id = p_sale_id;

    -- 3. Update Sale Details
    UPDATE sales
    SET
        client_id = (p_sale_data->>'client_id')::UUID,
        total_amount = (p_sale_data->>'total_amount')::NUMERIC,
        notes = p_sale_data->>'notes',
        scheduled_pickup = (p_sale_data->>'scheduled_pickup')::TIMESTAMP WITH TIME ZONE,
        is_delivery = v_is_delivery,
        delivery_address_id = v_delivery_address_id,
        delivery_fee = COALESCE((p_sale_data->>'delivery_fee')::NUMERIC, 0),
        delivery_zip_code = v_delivery_zip_code,
        delivery_street = v_delivery_street,
        delivery_number = v_delivery_number,
        delivery_complement = v_delivery_complement,
        delivery_neighborhood = v_delivery_neighborhood,
        delivery_city = v_delivery_city,
        delivery_state = v_delivery_state
    WHERE id = p_sale_id;

    -- 4. Insert New Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
    LOOP
        INSERT INTO public.sale_items (
            sale_id,
            product_catalog_id,
            product_item_id,
            name,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            p_sale_id,
            (v_item->>'product_catalog_id')::UUID,
            (v_item->>'product_item_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'total_price')::NUMERIC
        );

        -- Stock update logic
        IF (v_item->>'product_item_id') IS NOT NULL THEN
            UPDATE public.product_item
            SET status = 'sold',
                sold_at = CURRENT_TIMESTAMP,
                sale_id = p_sale_id
            WHERE id = (v_item->>'product_item_id')::UUID;
        ELSE
            UPDATE public.product_catalog
            SET quantity = COALESCE(quantity, 0) - (v_item->>'quantity')::INTEGER
            WHERE id = (v_item->>'product_catalog_id')::UUID
            AND is_internal = false;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$function$;

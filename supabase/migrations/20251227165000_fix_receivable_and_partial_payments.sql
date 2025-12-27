-- Add payment_date to accounts_receivable
ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_sale_id ON public.accounts_receivable(sale_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_payment_date ON public.accounts_receivable(payment_date);

-- Try to populate sale_id for existing records based on description
-- Description format is 'Venda PDV #' || display_id
UPDATE public.accounts_receivable ar
SET sale_id = s.id,
    payment_date = CASE WHEN ar.status = 'received' THEN ar.entry_date ELSE NULL END
FROM public.sales s
WHERE ar.sale_id IS NULL 
  AND ar.description LIKE 'Venda PDV #' || s.display_id::text;

-- Update complete_sale RPC
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
    v_display_id BIGINT;
    v_receivable_id UUID;
    v_item jsonb;
    v_payment jsonb;
    v_is_delivery BOOLEAN;
    v_order_status VARCHAR(20);
    v_delivery_address_id UUID;
    v_delivery_zip_code TEXT;
    v_delivery_street TEXT;
    v_delivery_number TEXT;
    v_delivery_complement TEXT;
    v_delivery_neighborhood TEXT;
    v_delivery_city TEXT;
    v_delivery_state TEXT;
    v_total_paid NUMERIC := 0;
    v_total_amount NUMERIC;
    v_is_paid BOOLEAN;
BEGIN
    v_total_amount := (p_sale_data->>'total_amount')::NUMERIC;

    -- Determine flow status
    v_order_status := COALESCE(p_sale_data->>'order_status', 
                               CASE WHEN p_sale_data->>'scheduled_pickup' IS NOT NULL THEN 'received' ELSE 'delivered' END);

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
        order_status,
        payment_status,
        notes,
        change_amount,
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
        v_total_amount,
        'completed',
        v_order_status,
        'pending',
        p_sale_data->>'notes',
        COALESCE((p_sale_data->>'change_amount')::NUMERIC, 0),
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
            (v_item->>'quantity')::NUMERIC,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'total_price')::NUMERIC
        );

        IF (v_item->>'product_item_id') IS NOT NULL THEN
            UPDATE public.product_item SET status = 'sold', sold_at = CURRENT_TIMESTAMP, sale_id = v_sale_id WHERE id = (v_item->>'product_item_id')::UUID;
        ELSE
            UPDATE public.product_catalog SET quantity = COALESCE(quantity, 0) - (v_item->>'quantity')::NUMERIC
            WHERE id = (v_item->>'product_catalog_id')::UUID AND is_internal = false;
        END IF;
    END LOOP;

    -- Insert payments
    IF p_payments_data IS NOT NULL AND jsonb_array_length(p_payments_data) > 0 THEN
        FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments_data)
        LOOP
            INSERT INTO public.sale_payments (
                sale_id, amount, payment_method, pix_key_id, machine_id, card_flag, installments
            ) VALUES (
                v_sale_id, (v_payment->>'amount')::NUMERIC, v_payment->>'payment_method', 
                (v_payment->>'pix_key_id')::UUID, (v_payment->>'machine_id')::UUID, 
                v_payment->>'card_flag', COALESCE((v_payment->>'installments')::INTEGER, 1)
            );
            v_total_paid := v_total_paid + (v_payment->>'amount')::NUMERIC;
        END LOOP;
    END IF;

    v_is_paid := v_total_paid >= v_total_amount;

    UPDATE public.sales SET payment_status = CASE WHEN v_is_paid THEN 'paid' ELSE 'pending' END WHERE id = v_sale_id;

    -- Create Accounts Receivable Record
    INSERT INTO public.accounts_receivable (
        description, gross_value, tax_rate, entry_date, payment_date, status, client_id, payment_method, sale_id
    ) VALUES (
        'Venda PDV #' || v_display_id::text, v_total_amount, 0, CURRENT_TIMESTAMP, 
        CASE WHEN v_is_paid THEN CURRENT_TIMESTAMP ELSE NULL END,
        CASE WHEN v_is_paid THEN 'received' ELSE 'pending' END,
        (p_sale_data->>'client_id')::UUID,
        CASE 
            WHEN p_payments_data IS NULL OR jsonb_array_length(p_payments_data) = 0 THEN 'cash'
            WHEN jsonb_array_length(p_payments_data) > 1 THEN 'multiple'
            ELSE (p_payments_data->0->>'payment_method')
        END,
        v_sale_id
    ) RETURNING id INTO v_receivable_id;
    
    -- Create Receivable Payments if multiple
    IF p_payments_data IS NOT NULL AND jsonb_array_length(p_payments_data) > 0 THEN
        FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments_data)
        LOOP
            INSERT INTO public.receivable_payments (
                receivable_id, amount, payment_method, card_brand, pix_key_id, tax_rate
            ) VALUES (
                v_receivable_id, (v_payment->>'amount')::NUMERIC, v_payment->>'payment_method', 
                v_payment->>'card_brand', (v_payment->>'pix_key_id')::UUID, 0
            );
        END LOOP;
    END IF;

    RETURN jsonb_build_object('sale_id', v_sale_id, 'display_id', v_display_id);
END;
$function$;

-- Update add_payment_to_order RPC
CREATE OR REPLACE FUNCTION public.add_payment_to_order(
    p_sale_id UUID, p_amount DECIMAL, p_payment_method TEXT, p_pix_key_id UUID DEFAULT NULL, 
    p_machine_id UUID DEFAULT NULL, p_card_flag TEXT DEFAULT NULL, p_installments INTEGER DEFAULT 1
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_payment_id UUID; v_receivable_id UUID; v_display_id BIGINT; v_client_id UUID; v_total_amount NUMERIC; v_total_paid NUMERIC; v_is_paid BOOLEAN;
BEGIN
    SELECT display_id, client_id, total_amount INTO v_display_id, v_client_id, v_total_amount FROM public.sales WHERE id = p_sale_id;
    IF v_display_id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

    INSERT INTO public.sale_payments (
        sale_id, amount, payment_method, pix_key_id, machine_id, card_flag, installments
    ) VALUES (
        p_sale_id, p_amount, p_payment_method, p_pix_key_id, p_machine_id, p_card_flag, p_installments
    ) RETURNING id INTO v_payment_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM public.sale_payments WHERE sale_id = p_sale_id;
    v_is_paid := v_total_paid >= v_total_amount;

    IF v_is_paid THEN UPDATE public.sales SET payment_status = 'paid' WHERE id = p_sale_id; END IF;

    SELECT id INTO v_receivable_id FROM public.accounts_receivable WHERE sale_id = p_sale_id;

    IF v_receivable_id IS NOT NULL THEN
        UPDATE public.accounts_receivable SET 
            status = CASE WHEN v_is_paid THEN 'received' ELSE 'pending' END,
            payment_date = CASE WHEN v_is_paid THEN CURRENT_TIMESTAMP ELSE payment_date END,
            payment_method = CASE WHEN (SELECT COUNT(*) FROM public.sale_payments WHERE sale_id = p_sale_id) > 1 THEN 'multiple' ELSE p_payment_method END
        WHERE id = v_receivable_id;

        INSERT INTO public.receivable_payments (receivable_id, amount, payment_method, card_brand, pix_key_id, tax_rate)
        VALUES (v_receivable_id, p_amount, p_payment_method, p_card_flag, p_pix_key_id, 0);
    ELSE
        INSERT INTO public.accounts_receivable (description, gross_value, tax_rate, entry_date, payment_date, status, client_id, payment_method, sale_id)
        VALUES ('Pagamento Adicional - Pedido #' || v_display_id::text, p_amount, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'received', v_client_id, p_payment_method, p_sale_id)
        RETURNING id INTO v_receivable_id;

        INSERT INTO public.receivable_payments (receivable_id, amount, payment_method, card_brand, pix_key_id, tax_rate)
        VALUES (v_receivable_id, p_amount, p_payment_method, p_card_flag, p_pix_key_id, 0);
    END IF;
    RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;

-- Update update_order RPC
CREATE OR REPLACE FUNCTION public.update_order(p_sale_id UUID, p_sale_data JSONB, p_items_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_old_items RECORD; v_item JSONB; v_is_internal BOOLEAN; v_total_amount NUMERIC; v_total_paid NUMERIC; v_is_paid BOOLEAN;
BEGIN
    v_total_amount := (p_sale_data->>'total_amount')::NUMERIC;
    FOR v_old_items IN SELECT * FROM public.sale_items WHERE sale_id = p_sale_id LOOP
         IF v_old_items.product_item_id IS NOT NULL THEN UPDATE public.product_item SET status = 'in_stock', sale_id = NULL, sold_at = NULL WHERE id = v_old_items.product_item_id;
        ELSE IF EXISTS (SELECT 1 FROM public.product_catalog WHERE id = v_old_items.product_catalog_id AND is_internal = false) THEN UPDATE public.product_catalog SET quantity = quantity + v_old_items.quantity WHERE id = v_old_items.product_catalog_id; END IF; END IF;
    END LOOP;
    DELETE FROM public.sale_items WHERE sale_id = p_sale_id;
    UPDATE public.sales SET total_amount = v_total_amount, client_id = (p_sale_data->>'client_id')::UUID, notes = p_sale_data->>'notes', scheduled_pickup = (p_sale_data->>'scheduled_pickup')::TIMESTAMP WITH TIME ZONE, is_delivery = COALESCE((p_sale_data->>'is_delivery')::BOOLEAN, false), delivery_address_id = (p_sale_data->>'delivery_address_id')::UUID, delivery_fee = COALESCE((p_sale_data->>'delivery_fee')::NUMERIC, 0), delivery_zip_code = p_sale_data->>'delivery_zip_code', delivery_street = p_sale_data->>'delivery_street', delivery_number = p_sale_data->>'delivery_number', delivery_complement = p_sale_data->>'delivery_complement', delivery_neighborhood = p_sale_data->>'delivery_neighborhood', delivery_city = p_sale_data->>'delivery_city', delivery_state = p_sale_data->>'delivery_state'
    WHERE id = p_sale_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid FROM public.sale_payments WHERE sale_id = p_sale_id;
    v_is_paid := v_total_paid >= v_total_amount;

    UPDATE public.accounts_receivable SET gross_value = v_total_amount, client_id = (p_sale_data->>'client_id')::UUID, status = CASE WHEN v_is_paid THEN 'received' ELSE 'pending' END, payment_date = CASE WHEN v_is_paid THEN COALESCE(payment_date, CURRENT_TIMESTAMP) ELSE NULL END WHERE sale_id = p_sale_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data) LOOP
        INSERT INTO public.sale_items (sale_id, product_catalog_id, product_item_id, name, unit_price, quantity, total_price)
        VALUES (p_sale_id, (v_item->>'product_catalog_id')::UUID, (v_item->>'product_item_id')::UUID, v_item->>'name', (v_item->>'unit_price')::NUMERIC, (v_item->>'quantity')::NUMERIC, (v_item->>'total_price')::NUMERIC);
        IF (v_item->>'product_item_id') IS NOT NULL THEN UPDATE public.product_item SET status = 'sold', sold_at = CURRENT_TIMESTAMP, sale_id = p_sale_id WHERE id = (v_item->>'product_item_id')::UUID;
        ELSE SELECT is_internal INTO v_is_internal FROM public.product_catalog WHERE id = (v_item->>'product_catalog_id')::UUID;
        IF v_is_internal = false THEN UPDATE public.product_catalog SET quantity = COALESCE(quantity, 0) - (v_item->>'quantity')::NUMERIC WHERE id = (v_item->>'product_catalog_id')::UUID; END IF; END IF;
    END LOOP;
    RETURN jsonb_build_object('success', true);
END;
$$;


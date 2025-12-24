-- Add Payment to existing Order
CREATE OR REPLACE FUNCTION public.add_payment_to_order(
    p_sale_id UUID,
    p_amount DECIMAL,
    p_payment_method TEXT,
    p_pix_key_id UUID DEFAULT NULL,
    p_machine_id UUID DEFAULT NULL,
    p_card_flag TEXT DEFAULT NULL,
    p_installments INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id UUID;
    v_receivable_id UUID;
    v_display_id BIGINT;
    v_client_id UUID;
BEGIN
    -- Get sale info
    SELECT display_id, client_id INTO v_display_id, v_client_id
    FROM public.sales
    WHERE id = p_sale_id;

    IF v_display_id IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Insert Payment
    INSERT INTO public.sale_payments (
        sale_id,
        amount,
        payment_method,
        pix_key_id,
        machine_id,
        card_flag,
        installments
    ) VALUES (
        p_sale_id,
        p_amount,
        p_payment_method,
        p_pix_key_id,
        p_machine_id,
        p_card_flag,
        p_installments
    ) RETURNING id INTO v_payment_id;

    -- Update or Insert Receivable (If partial, we append to existing receivable or create new?)
    -- Logic: usually 1 sale = 1 receivable. But if we adding payment later, maybe we just want to track it.
    -- Current system creates one receivable per sale.
    -- Let's create a NEW receivable entry for this specific payment to keep things clean and traceable, 
    -- linking it to the same client.
    
    INSERT INTO public.accounts_receivable (
        description,
        gross_value,
        tax_rate, 
        entry_date,
        status,
        client_id,
        payment_method
    ) VALUES (
        'Pagamento Adicional - Pedido #' || v_display_id::text,
        p_amount,
        0,
        CURRENT_TIMESTAMP,
        'received',
        v_client_id,
        p_payment_method
    ) RETURNING id INTO v_receivable_id;

    INSERT INTO public.receivable_payments (
        receivable_id,
        amount,
        payment_method,
        card_brand,
        pix_key_id,
        tax_rate
    ) VALUES (
        v_receivable_id,
        p_amount,
        p_payment_method,
        p_card_flag,
        p_pix_key_id,
        0
    );

    RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$;

-- Delete Order and Restore Stock
CREATE OR REPLACE FUNCTION public.delete_order(
    p_sale_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- 1. Restore Stock for items not linked to specific product_item (internal count-based)
    --    And for linked items (product_item), set status back to 'in_stock'
    
    FOR v_item IN SELECT * FROM public.sale_items WHERE sale_id = p_sale_id
    LOOP
        IF v_item.product_item_id IS NOT NULL THEN
            -- Restore unique item
            UPDATE public.product_item
            SET status = 'in_stock',
                sold_at = NULL,
                sale_id = NULL
            WHERE id = v_item.product_item_id;
        ELSE
            -- Restore quantity for internal items (if tracked by quantity) or non-internal
            -- Check if it is internal
            IF EXISTS (SELECT 1 FROM public.product_catalog WHERE id = v_item.product_catalog_id AND is_internal = false) THEN
                 UPDATE public.product_catalog
                 SET quantity = quantity + v_item.quantity
                 WHERE id = v_item.product_catalog_id;
            END IF;
        END IF;
    END LOOP;

    -- 2. Delete payments (Cascade should handle this if set, but let's be explicit or safe)
    DELETE FROM public.sale_payments WHERE sale_id = p_sale_id;
    
    -- 3. Delete items
    DELETE FROM public.sale_items WHERE sale_id = p_sale_id;

    -- 4. Delete sale
    DELETE FROM public.sales WHERE id = p_sale_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Update Order (Full Replace of Items approach)
CREATE OR REPLACE FUNCTION public.update_order(
    p_sale_id UUID,
    p_sale_data JSONB,
    p_items_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status TEXT;
    v_item JSONB;
    v_is_internal BOOLEAN;
BEGIN
    -- 1. Get current status to validate if we can edit? (Optional, assuming frontend checks)
    
    -- 2. "Return" old items (Restore stock)
    FOR v_item IN SELECT * FROM public.sale_items WHERE sale_id = p_sale_id
    LOOP
        -- Identical logic to delete_order for stock restoration
         IF v_item.product_item_id IS NOT NULL THEN
            UPDATE public.product_item
            SET status = 'in_stock',
                sold_at = NULL,
                sale_id = NULL
            WHERE id = (v_item->>'product_item_id')::UUID; -- Cast properly if using record? No, v_item is record here.
            -- Wait, loop variable in PLPGSQL iterates over rows.
             UPDATE public.product_item
            SET status = 'in_stock',
                sold_at = NULL,
                sale_id = NULL
            WHERE id = (v_item.product_item_id);
        ELSE
            IF EXISTS (SELECT 1 FROM public.product_catalog WHERE id = v_item.product_catalog_id AND is_internal = false) THEN
                 UPDATE public.product_catalog
                 SET quantity = quantity + v_item.quantity
                 WHERE id = v_item.product_catalog_id;
            END IF;
        END IF;
    END LOOP;

    -- 3. Delete old items
    DELETE FROM public.sale_items WHERE sale_id = p_sale_id;

    -- 4. Update Sale Details
    UPDATE public.sales
    SET 
        total_amount = (p_sale_data->>'total_amount')::DECIMAL,
        client_id = (p_sale_data->>'client_id')::UUID,
        notes = p_sale_data->>'notes',
        scheduled_pickup = (p_sale_data->>'scheduled_pickup')::TIMESTAMP WITH TIME ZONE,
        is_delivery = COALESCE((p_sale_data->>'is_delivery')::BOOLEAN, false),
        delivery_address_id = (p_sale_data->>'delivery_address_id')::UUID,
        delivery_fee = COALESCE((p_sale_data->>'delivery_fee')::DECIMAL, 0)
    WHERE id = p_sale_id;

    -- 5. Insert New Items (Consume Stock)
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
            p_sale_id,
            (v_item->>'product_catalog_id')::UUID,
            (v_item->>'product_item_id')::UUID,
            v_item->>'name',
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'quantity')::DECIMAL,
            (v_item->>'total_price')::DECIMAL
        );

        IF (v_item->>'product_item_id') IS NOT NULL THEN
            UPDATE public.product_item
            SET status = 'sold',
                sold_at = CURRENT_TIMESTAMP,
                sale_id = p_sale_id
            WHERE id = (v_item->>'product_item_id')::UUID;
        ELSE
            SELECT is_internal INTO v_is_internal
            FROM public.product_catalog
            WHERE id = (v_item->>'product_catalog_id')::UUID;

            IF v_is_internal = false THEN
                UPDATE public.product_catalog
                SET quantity = COALESCE(quantity, 0) - (v_item->>'quantity')::INTEGER
                WHERE id = (v_item->>'product_catalog_id')::UUID;
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;

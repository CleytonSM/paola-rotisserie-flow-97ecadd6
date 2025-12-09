-- Fix stock decrement for non-internal products
-- Updates complete_sale RPC to decrement product_catalog.quantity for non-internal products
CREATE OR REPLACE FUNCTION public.complete_sale(
    p_sale_data JSONB,
    p_items_data JSONB,
    p_payments_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Update stock summary functions to respect product_catalog.quantity

-- 1. Update single product stock function
CREATE OR REPLACE FUNCTION public.get_product_catalog_stock(catalog_id UUID)
RETURNS TABLE (
    catalog_id UUID,
    catalog_name TEXT,
    total_items BIGINT,
    
    -- Itens ainda válidos (não vendidos e não vencidos)
    available_valid BIGINT,
    
    -- Itens disponíveis mas já vencidos (para descarte ou promoção urgente)
    available_expired BIGINT,
    
    -- Itens já vendidos
    sold BIGINT,
    
    -- Itens reservados (se você usar reserva)
    reserved BIGINT,
    
    -- Itens descartados manualmente
    discarded BIGINT
)
LANGUAGE sql STABLE
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

-- 2. Update all catalog stocks function
CREATE OR REPLACE FUNCTION public.get_all_catalog_stocks(catalog_ids UUID[])
RETURNS TABLE (
    catalog_id UUID,
    catalog_name TEXT,
    total_items BIGINT,
    available_valid BIGINT,
    available_expired BIGINT
)
LANGUAGE sql STABLE
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

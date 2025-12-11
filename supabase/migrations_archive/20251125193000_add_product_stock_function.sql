-- Add stock summary function for product catalog
-- Returns inventory statistics for a given catalog product

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
        
        COUNT(pi.id)                               AS total_items,
        
        COUNT(pi.id) FILTER (WHERE 
            pi.status = 'available' 
            AND pi.expires_at >= NOW() AT TIME ZONE 'UTC'
        )                                          AS available_valid,
        
        COUNT(pi.id) FILTER (WHERE 
            pi.status = 'available' 
            AND pi.expires_at < NOW() AT TIME ZONE 'UTC'
        )                                          AS available_expired,
        
        COUNT(pi.id) FILTER (WHERE pi.status = 'sold')        AS sold,
        COUNT(pi.id) FILTER (WHERE pi.status = 'reserved')    AS reserved,
        COUNT(pi.id) FILTER (WHERE pi.status = 'discarded')   AS discarded
        
    FROM product_catalog pc
    LEFT JOIN product_item pi ON pi.catalog_id = pc.id
    WHERE pc.id = get_product_catalog_stock.catalog_id
      AND pc.is_active = true
    GROUP BY pc.id, pc.name;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_product_catalog_stock(UUID) TO authenticated;

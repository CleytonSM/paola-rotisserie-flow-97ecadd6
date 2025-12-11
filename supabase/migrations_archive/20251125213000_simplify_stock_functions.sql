-- Update stock summary functions to remove sold, reserved, and discarded fields

-- 1. Update single product stock function
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
        
        COUNT(pi.id) FILTER (WHERE pi.status = 'available') AS total_items,
        
        COUNT(pi.id) FILTER (WHERE 
            pi.status = 'available' 
            AND pi.expires_at >= NOW() AT TIME ZONE 'UTC'
        )                                          AS available_valid,
        
        COUNT(pi.id) FILTER (WHERE 
            pi.status = 'available' 
            AND pi.expires_at < NOW() AT TIME ZONE 'UTC'
        )                                          AS available_expired
        
    FROM product_catalog pc
    LEFT JOIN product_item pi ON pi.catalog_id = pc.id
    WHERE (catalog_ids IS NULL OR pc.id = ANY(catalog_ids))
      AND pc.is_active = true
    GROUP BY pc.id, pc.name;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_all_catalog_stocks(UUID[]) TO authenticated;

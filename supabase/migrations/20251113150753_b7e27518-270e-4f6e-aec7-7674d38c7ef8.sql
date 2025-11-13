-- Fix function search_path security issue
-- Recreate the calculate_net_value function with fixed search_path
CREATE OR REPLACE FUNCTION public.calculate_net_value()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF NEW.payment_method = 'card' AND NEW.tax_rate IS NOT NULL THEN
        NEW.net_value := NEW.gross_value * (1 - NEW.tax_rate / 100);
    ELSE
        NEW.net_value := NEW.gross_value;
    END IF;
    RETURN NEW;
END;
$function$;
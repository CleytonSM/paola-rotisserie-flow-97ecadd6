-- Create trigger function to set status to 'vencido' when due_date < today and status = 'pendente'
CREATE OR REPLACE FUNCTION public.accounts_payable_update_status_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.status = 'pending') AND (NEW.due_date::date < current_date) THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS accounts_payable_update_status_trg ON public.accounts_payable;
CREATE TRIGGER accounts_payable_update_status_trg
BEFORE INSERT OR UPDATE ON public.accounts_payable
FOR EACH ROW EXECUTE FUNCTION public.accounts_payable_update_status_fn();
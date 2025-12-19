import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";
import { ClientAddress } from "@/types/entities";

export const getClientAddresses = async (clientId: string): Promise<DatabaseResult<ClientAddress[]>> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .select('*')
    .eq('client_id', clientId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error };
};

export const createClientAddress = async (address: Omit<ClientAddress, 'id'>): Promise<DatabaseResult<ClientAddress>> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .insert(address)
    .select()
    .single();

  return { data, error };
};

export const updateClientAddress = async (id: string, address: Partial<ClientAddress>): Promise<DatabaseResult<ClientAddress>> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .update(address)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteClientAddress = async (id: string): Promise<DatabaseResult<null>> => {
  const { error } = await supabase
    .from('client_addresses')
    .delete()
    .eq('id', id);

  return { data: null, error };
};

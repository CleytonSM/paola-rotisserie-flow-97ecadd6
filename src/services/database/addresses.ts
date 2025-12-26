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

export const upsertClientAddressByCep = async (address: Omit<ClientAddress, 'id'>): Promise<DatabaseResult<ClientAddress>> => {
  const { data: existingAddresses } = await getClientAddresses(address.client_id);
  
  const existingAddress = existingAddresses?.find(a => a.zip_code === address.zip_code);

  if (existingAddress) {
    return updateClientAddress(existingAddress.id, address);
  } else {
    // If no address with this CEP, create a new one. 
    // Mark as default if it's the first one or if we want to ensure it's the active one.
    return createClientAddress({ ...address, is_default: true });
  }
};

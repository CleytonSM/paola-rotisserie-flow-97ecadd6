import { supabase } from "@/integrations/supabase/client";
import { DatabaseResult } from "./types";

export type PixKeyType = 'aleatoria' | 'telefone' | 'cpf' | 'cnpj' | 'email';

export interface PixKey {
  id: string;
  type: PixKeyType;
  key_value: string;
  active: boolean;
  created_at: string;
}

export interface CreatePixKeyDTO {
  type: PixKeyType;
  key_value: string;
  active?: boolean;
}

export interface UpdatePixKeyDTO {
  type?: PixKeyType;
  key_value?: string;
  active?: boolean;
}

export const getPixKeys = async (options?: { activeOnly?: boolean }): Promise<DatabaseResult<PixKey[]>> => {
  try {
    let query = supabase
      .from('pix_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const createPixKey = async (data: CreatePixKeyDTO): Promise<DatabaseResult<PixKey>> => {
  try {
    const { data: pixKey, error } = await supabase
      .from('pix_keys')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return { data: pixKey, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const updatePixKey = async (id: string, data: UpdatePixKeyDTO): Promise<DatabaseResult<PixKey>> => {
  try {
    const { data: pixKey, error } = await supabase
      .from('pix_keys')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: pixKey, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const deletePixKey = async (id: string): Promise<DatabaseResult<void>> => {
  try {
    const { error } = await supabase
      .from('pix_keys')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const togglePixKeyStatus = async (id: string, active: boolean): Promise<DatabaseResult<PixKey>> => {
  return updatePixKey(id, { active });
};

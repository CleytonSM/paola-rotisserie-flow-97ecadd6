import { supabase } from "@/integrations/supabase/client";
import { DatabaseResult } from "./types";

export interface CardMachine {
  id: string;
  name: string;
  image_url?: string | null;
  created_at: string;
  flags?: CardFlag[];
}

export interface CardFlag {
  id: string;
  machine_id: string;
  brand: string;
  type: 'credit' | 'debit';
  tax_rate: number;
  created_at: string;
}

export interface CreateMachineDTO {
  name: string;
  image?: File;
}

export interface UpdateMachineDTO {
  name?: string;
  image?: File;
}

export interface CreateFlagDTO {
  machine_id: string;
  brand: string;
  type: 'credit' | 'debit';
  tax_rate: number;
}

interface MachineUpdatePayload {
  name?: string;
  image_url?: string;
}

const BUCKET_NAME = 'machine-images';

export const getMachines = async (): Promise<DatabaseResult<CardMachine[]>> => {
  try {
    const { data, error } = await supabase
      .from('card_machines')
      .select(`*, flags:card_flags(*)`)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const createMachine = async (data: CreateMachineDTO): Promise<DatabaseResult<CardMachine>> => {
  try {
    let image_url = null;

    if (data.image) {
      const fileExt = data.image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, data.image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      image_url = publicUrl;
    }

    const { data: machine, error } = await supabase
      .from('card_machines')
      .insert({ name: data.name, image_url })
      .select()
      .single();

    if (error) throw error;
    return { data: machine, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const updateMachine = async (id: string, data: UpdateMachineDTO): Promise<DatabaseResult<CardMachine>> => {
  try {
    const updates: MachineUpdatePayload = { name: data.name };

    if (data.image) {
      const fileExt = data.image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, data.image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      updates.image_url = publicUrl;
    }

    const { data: machine, error } = await supabase
      .from('card_machines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: machine, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const deleteMachine = async (id: string): Promise<DatabaseResult<void>> => {
  try {
    const { error } = await supabase
      .from('card_machines')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const addFlag = async (data: CreateFlagDTO): Promise<DatabaseResult<CardFlag>> => {
  try {
    const { data: flag, error } = await supabase
      .from('card_flags')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return { data: flag, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const deleteFlag = async (id: string): Promise<DatabaseResult<void>> => {
  try {
    const { error } = await supabase
      .from('card_flags')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

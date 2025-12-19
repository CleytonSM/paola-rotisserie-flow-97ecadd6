import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";
import { AppSettings } from "@/types/entities";

export const getAppSettings = async (): Promise<DatabaseResult<AppSettings>> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .single();

  return { data, error };
};

export const saveAppSettings = async (settings: Partial<AppSettings>): Promise<DatabaseResult<AppSettings>> => {
  // Check if exists
  const { data: existing } = await supabase.from('app_settings').select('id').single();

  if (existing) {
     const { data, error } = await supabase
      .from('app_settings')
      .update(settings)
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('app_settings')
      .insert(settings)
      .select()
      .single();
    return { data, error };
  }
};

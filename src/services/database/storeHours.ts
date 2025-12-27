import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";
import { StoreHour } from "@/types/entities";

export const getStoreHours = async (): Promise<DatabaseResult<StoreHour[]>> => {
  const { data, error } = await supabase
    .from('store_hours')
    .select('*')
    .order('day_of_week', { ascending: true });

  return { data, error };
};

export const saveStoreHours = async (hours: Partial<StoreHour>[]): Promise<DatabaseResult<StoreHour[]>> => {
  const { data, error } = await supabase
    .from('store_hours')
    .upsert(hours)
    .select();

  return { data, error };
};

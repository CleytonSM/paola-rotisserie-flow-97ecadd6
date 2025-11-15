/**
 * Refresh Tokens database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export const revokeRefreshTokens = async (userId: string): Promise<DatabaseResult<void>> => {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);

  return { data: null, error };
};

export const saveRefreshToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<DatabaseResult<void>> => {
  const { error } = await supabase
    .from('refresh_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      device_info: navigator.userAgent,
    });

  return { data: null, error };
};

export const getValidRefreshToken = async (
  userId: string,
  tokenHash: string
): Promise<DatabaseResult<boolean>> => {
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { data: null, error };
  }

  return { data: !!data, error: null };
};


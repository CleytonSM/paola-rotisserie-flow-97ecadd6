/**
 * Camada de abstração para autenticação
 * Isola implementação do Supabase para facilitar migração futura
 */

import { supabase } from "@/integrations/supabase/client";

export interface AuthResult {
  user: any | null;
  session: any | null;
  error: Error | null;
}

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return {
    user: data.user,
    session: data.session,
    error,
  };
};

export const signUp = async (email: string, password: string): Promise<AuthResult> => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  
  return {
    user: data.user,
    session: data.session,
    error,
  };
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentSession = async (): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.getSession();
  
  return {
    user: data.session?.user || null,
    session: data.session,
    error,
  };
};

export const onAuthStateChange = (callback: (session: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session);
    }
  );
  
  return subscription;
};
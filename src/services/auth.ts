/**
 * Camada de abstração para autenticação
 * Isola implementação do Supabase para facilitar migração futura
 * Inclui gerenciamento de refresh tokens
 */

import { supabase } from "@/integrations/supabase/client";

export interface AuthResult {
  user: any | null;
  session: any | null;
  error: Error | null;
}

// Função auxiliar para criar hash do token (simulado, já que crypto não está disponível no browser)
const hashToken = (token: string): string => {
  // Usar uma função simples de hash para o browser
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

// Salvar refresh token no banco (opcional, para auditoria)
const saveRefreshToken = async (userId: string, refreshToken: string, expiresIn: number): Promise<void> => {
  try {
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    const { error } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        device_info: navigator.userAgent,
      });
    
    // Não bloquear o fluxo se houver erro ao salvar (pode ser erro de permissão RLS)
    if (error && !error.message.includes('permission denied')) {
      console.error('Error saving refresh token:', error);
    }
  } catch (err) {
    // Não bloquear o fluxo se houver erro
    console.error('Error saving refresh token:', err);
  }
};

// Revogar todos os refresh tokens do usuário
const revokeUserRefreshTokens = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('revoked_at', null);
    
    if (error) {
      console.error('Error revoking refresh tokens:', error);
    }
  } catch (err) {
    console.error('Error revoking refresh tokens:', err);
  }
};

// Verificar e fazer refresh automático se necessário
export const ensureValidSession = async (): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    return { user: null, session: null, error };
  }
  
  if (!data.session) {
    return { user: null, session: null, error: null };
  }
  
  // Verificar se o token está expirado ou próximo de expirar (5 minutos de margem)
  const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (expiresAt - now < fiveMinutes) {
    // Tentar fazer refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      // Se o refresh falhar, limpar sessão
      await supabase.auth.signOut();
      return { user: null, session: null, error: refreshError || new Error('Session expired') };
    }
    
    return {
      user: refreshData.session.user,
      session: refreshData.session,
      error: null,
    };
  }
  
  return {
    user: data.session.user,
    session: data.session,
    error: null,
  };
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (!error && data.session) {
    // Salvar refresh token no banco para auditoria (não bloqueia o fluxo se falhar)
    const refreshToken = data.session.refresh_token;
    if (refreshToken && data.session.user) {
      // O Supabase gerencia o refresh token internamente
      // expires_at está em segundos Unix timestamp
      const expiresIn = data.session.expires_at 
        ? Math.max(0, data.session.expires_at - Math.floor(Date.now() / 1000))
        : 3600; // Default 1 hora se não disponível
      await saveRefreshToken(data.session.user.id, refreshToken, expiresIn);
    }
  }
  
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
  
  if (!error && data.session) {
    // Salvar refresh token no banco para auditoria (não bloqueia o fluxo se falhar)
    const refreshToken = data.session.refresh_token;
    if (refreshToken && data.session.user) {
      const expiresIn = data.session.expires_at 
        ? Math.max(0, data.session.expires_at - Math.floor(Date.now() / 1000))
        : 3600;
      await saveRefreshToken(data.session.user.id, refreshToken, expiresIn);
    }
  }
  
  return {
    user: data.user,
    session: data.session,
    error,
  };
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  // Obter usuário atual antes de fazer logout
  const { data: { session } } = await supabase.auth.getSession();
  
  // Revogar todos os refresh tokens do usuário
  if (session?.user?.id) {
    await revokeUserRefreshTokens(session.user.id);
  }
  
  // Fazer logout do Supabase
  const { error } = await supabase.auth.signOut();
  
  return { error };
};

export const getCurrentSession = async (): Promise<AuthResult> => {
  // Usar ensureValidSession para garantir que a sessão está válida
  return await ensureValidSession();
};

export const onAuthStateChange = (callback: (session: any) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // Se for um evento de refresh, salvar o novo token (não bloqueia o fluxo se falhar)
      if (event === 'TOKEN_REFRESHED' && session) {
        const refreshToken = session.refresh_token;
        if (refreshToken && session.user) {
          const expiresIn = session.expires_at 
            ? Math.max(0, session.expires_at - Math.floor(Date.now() / 1000))
            : 3600;
          await saveRefreshToken(session.user.id, refreshToken, expiresIn);
        }
      }
      
      callback(session);
    }
  );
  
  return subscription;
};
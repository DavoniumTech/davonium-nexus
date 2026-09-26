import { supabase, isSupabaseConfigured, configurationMessage } from './supabase.js';

export async function getSession() {
  if (!isSupabaseConfigured) return { session: null, error: new Error(configurationMessage()) };
  return supabase.auth.getSession();
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured) throw new Error(configurationMessage());
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, fullName = '') {
  if (!isSupabaseConfigured) throw new Error(configurationMessage());
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

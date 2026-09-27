import { supabase, isSupabaseConfigured } from './supabase.js';

/* ============================================================
   AUTH SERVICE
   Davonium Nexus
   ============================================================ */

/**
 * Get the currently authenticated Supabase session.
 */
export async function getSession() {
  if (!isSupabaseConfigured) {
    return {
      session: null,
      user: null
    };
  }

  const {
    data,
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return {
    session: data?.session || null,
    user: data?.session?.user || null
  };
}

/**
 * Sign in an existing Nexus user.
 */
export async function signIn(
  email,
  password
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured.'
    );
  }

  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password: String(password || '')
  });

  if (error) {
    throw error;
  }

  return {
    session: data?.session || null,
    user: data?.user || null
  };
}

/**
 * Create a new Nexus account.
 */
export async function signUp(
  email,
  password,
  fullName = ''
) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured.'
    );
  }

  const cleanEmail =
    String(email || '').trim();

  const cleanName =
    String(fullName || '').trim();

  const {
    data,
    error
  } = await supabase.auth.signUp({
    email: cleanEmail,
    password: String(password || ''),
    options: {
      data: {
        full_name: cleanName
      }
    }
  });

  if (error) {
    throw error;
  }

  return {
    session: data?.session || null,
    user: data?.user || null
  };
}

/**
 * Sign out the current Nexus user.
 */
export async function signOut() {
  if (!isSupabaseConfigured) {
    return true;
  }

  const {
    error
  } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  return true;
}
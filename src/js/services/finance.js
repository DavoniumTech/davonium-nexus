import { supabase } from './supabase.js';

export async function getFinancialEntries(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('nexus_financial_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', {
      ascending: false,
      nullsFirst: false
    })
    .order('created_at', {
      ascending: false
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createFinancialEntry(userId, entry) {
  if (!userId) {
    throw new Error(
      'You must be signed in to save financial records.'
    );
  }

  const amount = Number(entry.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      'Financial amount must be greater than zero.'
    );
  }

  if (
    entry.entry_type !== 'revenue' &&
    entry.entry_type !== 'expense'
  ) {
    throw new Error(
      'Financial entry type must be revenue or expense.'
    );
  }

  const { data, error } = await supabase
    .from('nexus_financial_entries')
    .insert({
      user_id: userId,
      entry_type: entry.entry_type,
      title: String(entry.title || '').trim(),
      amount,
      body: String(entry.body || '').trim(),
      entry_date: entry.entry_date || null
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteFinancialEntry(
  userId,
  entryId
) {
  if (!userId) {
    throw new Error(
      'You must be signed in.'
    );
  }

  if (!entryId) {
    throw new Error(
      'Financial record ID is missing.'
    );
  }

  const { error } = await supabase
    .from('nexus_financial_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return true;
}
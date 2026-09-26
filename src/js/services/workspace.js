import { supabase, isSupabaseConfigured } from './supabase.js';

function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Configure Supabase before managing workspaces.');
  }
}

export async function createWorkspaceWithOwner(name) {
  requireSupabase();

  const workspaceName = String(name ?? '').trim();
  if (workspaceName.length < 2 || workspaceName.length > 120) {
    throw new Error('Workspace name must be between 2 and 120 characters.');
  }

  const { data, error } = await supabase.rpc(
    'create_workspace_with_owner',
    { workspace_name: workspaceName }
  );

  if (error) throw error;
  return data;
}

export async function getMyWorkspaces(userId) {
  requireSupabase();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, created_by)')
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? [])
    .map((membership) => ({
      id: membership.workspace_id,
      role: membership.role,
      name: membership.workspaces?.name ?? 'Unnamed workspace',
      created_by: membership.workspaces?.created_by ?? null
    }))
    .filter((workspace) => workspace.id);
}

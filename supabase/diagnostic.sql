-- Read-only diagnostics for the existing Davonium Nexus Supabase project.
-- These queries do not modify your database.

select
  has_table_privilege('authenticated','public.workspace_members','SELECT') as authenticated_can_select_workspace_members,
  has_table_privilege('authenticated','public.workspaces','SELECT') as authenticated_can_select_workspaces;

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as function_owner,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where (n.nspname = 'private' and p.proname = 'is_workspace_member')
   or (n.nspname = 'public' and p.proname = 'create_workspace_with_owner');

select
  grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('workspace_members','workspaces')
order by table_name, grantee, privilege_type;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('workspace_members','workspaces')
order by tablename, policyname;

# Existing Supabase connection

This project preserves the Supabase setup already configured for Davonium Nexus.

Known working items:

- Email authentication enabled.
- `public.create_workspace_with_owner(workspace_name text)` exists and is SECURITY DEFINER.
- `private.is_workspace_member(target_workspace_id uuid, target_user_id uuid)` exists and is SECURITY DEFINER.
- Authenticated role can execute both functions.
- Authenticated role has SELECT on `public.workspace_members` and `public.workspaces`.
- Existing RLS policies remain in place.

No destructive database migration is included in this release. `diagnostic.sql` contains read-only checks only.

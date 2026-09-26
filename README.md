# Davonium Nexus — Control Center

Private personal control center for Davonium Technologies.

## Local setup

1. Open this folder in VS Code.
2. Make sure `.env.local` exists in the project root.
3. Put your Supabase project URL in `VITE_SUPABASE_URL`.
4. Put your Supabase publishable/anon key in `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Open Command Prompt in this folder and run:

```cmd
npm install
npm run dev
```

6. Open the localhost URL Vite prints (normally `http://localhost:5173`).

## Current Supabase requirements

This frontend uses the existing authentication and workspace RPC:

- `public.create_workspace_with_owner(workspace_name text)`
- `private.is_workspace_member(target_workspace_id uuid, target_user_id uuid)`
- authenticated SELECT on `public.workspace_members`
- authenticated SELECT on `public.workspaces`

Do not put a service-role key in the frontend.

## Themes

The default is **Light**. Settings supports **Light**, **Dark**, and **System** modes plus 20 accent colors. The accent is applied across the interface.

## Data model note

The existing Supabase workspace/auth connection is preserved. The new personal content modules currently use browser local storage so the UI is functional without inventing or altering database tables. They can be migrated to Supabase tables later when the schema is finalized.

## GitHub

Do not commit `.env.local`. It is ignored by `.gitignore`. Commit `.env.example` instead.

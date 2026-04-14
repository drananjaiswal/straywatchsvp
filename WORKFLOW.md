# Future Project Workflow

Use this checklist for every new GitHub + Vercel + Supabase product so the frontend, backend, and deploy pipeline stay aligned from day one.

## 1. Create The Project Shell

1. Create the GitHub repository.
2. Keep `main` as the production branch.
3. Connect the repo to Vercel immediately.
4. Confirm pushes to `main` auto-deploy production.
5. Confirm non-`main` branches or PRs create preview deployments.

## 2. Create A Dedicated Supabase Project

1. Create one Supabase project per app.
2. Do not reuse another app's Supabase project.
3. Name the Supabase project to match the product clearly.
4. Copy the project URL and anon key only after verifying the project ref.

## 3. Apply The Initial Schema Before Frontend Testing

1. Run the full SQL migration in Supabase SQL Editor.
2. Verify all required tables exist.
3. Verify all required RPC functions exist.
4. Verify any seed rows or lookup data were inserted.
5. Verify RLS policies are active where expected.

## 4. Seed Backend Identity

Every product should have an `app_metadata` row so the frontend can verify it is connected to the right backend.

Minimum fields:

```sql
app_key
app_name
schema_version
```

Recommended seed example:

```sql
insert into app_metadata (app_key, app_name, schema_version)
values ('your-app-key', 'Your App Name', 1)
on conflict (app_key) do update
set app_name = excluded.app_name,
    schema_version = excluded.schema_version,
    updated_at = now();
```

## 5. Set Environment Variables Carefully

For Vite apps, use:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Rules:

1. Never paste env vars from another project without verifying the Supabase project ref.
2. Update env vars in Vercel before debugging client code.
3. Redeploy after any Vercel env var change.

## 6. Protect Admin Access Properly

1. Put admin tools on a separate `/admin` route.
2. Use OAuth sign-in for admins when possible.
3. Keep authorization separate from authentication.
4. Store approved admin emails in `admin_users`.
5. Check admin rights through backend logic such as `is_current_user_admin()`.
6. Log admin actions in `admin_actions`.

Recommended admin rule:

1. Public users can view the app anonymously.
2. Admins authenticate separately.
3. Only approved admin emails can access destructive or privileged controls.

## 7. Prefer Soft-Hide Over Hard Delete

For moderation or reset controls:

1. Add flags like `is_hidden` and `hidden_at`.
2. Filter hidden rows out of public queries.
3. Restore hidden rows instead of deleting them by default.
4. Reserve hard deletes for exceptional cleanup only.

## 8. Add Frontend Guard Rails

Every frontend should fail fast if it is connected to the wrong backend.

Recommended checks:

1. Verify `app_metadata.app_key`.
2. Verify minimum `schema_version`.
3. Fall back to table-shape checks if metadata is missing.
4. Show a clear backend mismatch message instead of surfacing raw database errors.

## 9. Verify Production In A Fixed Order

After deployment, always test in this order:

1. Homepage loads.
2. One read query works.
3. One write action works.
4. Admin login works.
5. Core feature flow works end to end.

For this app, that means:

1. Homepage loads.
2. Heatmap loads.
3. One sighting submission succeeds.
4. `/admin` works with the approved Google account.
5. Ward selection zooms the map correctly.

## 10. Standard Operating Rules

1. One app equals one Supabase project.
2. One app equals one Vercel project.
3. Verify environment variables before changing frontend code.
4. Do not blindly replace `supabase.js` to treat symptoms.
5. Prefer small additive migrations over destructive database changes.
6. Keep README, migrations, and live infrastructure aligned.

## Quick Launch Checklist

```md
- Create GitHub repo
- Connect Vercel to repo
- Create dedicated Supabase project
- Run migration
- Seed app_metadata
- Set Vercel env vars
- Enable OAuth provider if admin access exists
- Add approved admin email to admin_users
- Test homepage
- Test one submission
- Test /admin
- Test one core feature
```

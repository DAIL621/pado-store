# Migration baseline status

Checked on 2026-07-21.

## Local repository

The repository contains seven ordered migrations from `202607060400` through `202607211000`. Supabase CLI `2.109.1` is pinned as a development dependency, and `supabase/config.toml` enables migrations while disabling automatic seed execution.

## Production reconciliation status

The known production project reference is `wvbdtiewkmwbdelajohy`. This workstation does not currently provide `SUPABASE_ACCESS_TOKEN` or `SUPABASE_DB_PASSWORD`, so `supabase link` and the remote `supabase_migrations.schema_migrations` comparison have not been completed.

Do not guess history entries. Before the first automated deployment:

1. Set the two credentials in the process environment.
2. Run `supabase link --project-ref wvbdtiewkmwbdelajohy`.
3. Run `supabase migration list --linked`.
4. For each local migration that appears to be missing remotely, inspect the production schema and data effects.
5. If its SQL was already applied manually and every effect matches, record it with `supabase migration repair <version> --status applied`.
6. Leave genuinely pending migrations pending, run `supabase db push --linked --dry-run`, review, then deploy.

The address-book table was previously reported missing in production. Therefore address migrations must not be marked applied solely from their filenames; verify the actual table and policies first.

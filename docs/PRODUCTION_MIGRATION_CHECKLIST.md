# Production migration checklist

## One-time setup

- Create a protected GitHub Environment named `production` with required reviewers.
- Add `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` as Environment secrets.
- Add `SUPABASE_PROJECT_REF` as an Environment variable. The expected project ref is `wvbdtiewkmwbdelajohy`.
- Confirm that database backups or point-in-time recovery are available.
- Reconcile existing manually applied SQL with migration history before the first automated push.

## Before deployment

- Review every new file in `supabase/migrations` and its rollback plan.
- Confirm migration filenames are unique, timestamped, and append-only.
- Run `pnpm run lint`, `pnpm run build`, `pnpm run verify:operations`, and `pnpm run verify:security`.
- Link to the intended project and run `pnpm run migration:dry-run`.
- Compare `supabase migration list --linked`; do not deploy while local/remote history differs unexpectedly.
- For SQL previously run manually, verify every affected object in the production schema before using `supabase migration repair <version> --status applied`. Repair changes history only, not schema.

## Deployment after GitHub push

1. Push the reviewed commit to `master`.
2. Open GitHub Actions and select **Supabase production migrations**.
3. Run the workflow and approve the protected `production` environment.
4. The workflow links the project, performs a dry run, applies pending migrations in order, and runs operations/security verification in strict remote mode.
5. Confirm the workflow log reports synchronized migration history.
6. Smoke-test public product pages, sign-in, checkout, address book, admin products, and admin orders.

## Rollback / incident response

- Stop deployment and record the failed migration version.
- Prefer a new forward-only compensating migration that restores compatibility and preserves data.
- For destructive DDL, restore from the verified backup/PITR point only with explicit production approval.
- Never run `supabase db reset --linked` against production.
- Do not treat `migration repair --status reverted` as a schema rollback; it only edits migration history.
- After recovery, rerun migration status and application smoke tests, then document the incident.

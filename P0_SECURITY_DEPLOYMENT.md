# P0 Security v2 deployment

## Data policy

- Existing orders remain immutable history with `security_version=1`.
- The migration does not rewrite existing order, payment, shipment, refund, or inventory business data.
- Only orders created through `pado_create_order_v2` receive `security_version=2`.
- Security v2 payment and refund RPCs reject legacy orders.

## Required production configuration

- Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Set `PADO_ALLOWED_ORIGINS` to exact HTTPS storefront/admin origins.
- Keep Supabase service-role and Toss secret keys server-only.

## Deployment order

1. Back up the production schema and affected tables using the approved private backup process.
2. Run the migration in an isolated database and execute `supabase/INTEGRITY_AUDIT.sql`.
3. Apply `202607231400_p0_security_v2.sql`.
4. Run `supabase/INTEGRITY_AUDIT.sql` again. Investigate every `FAIL`; do not auto-correct rows.
5. Configure the rate-limit and origin environment variables.
6. Deploy the application code.
7. Create one new test order and verify Toss TEST confirmation, one inventory decrement, refund, and shipment display.

## Rollback

1. Disable new order creation before rollback.
2. Preserve every v2 order and ledger row in a private backup.
3. Roll application traffic back to the prior release.
4. Run `supabase/migrations/rollback/202607231400_p0_security_v2.rollback.sql` only when no v2 records must remain queryable.

The rollback is intentionally destructive to v2 schema objects. It never changes legacy order history, but it must not be used after live v2 traffic without a reviewed data-retention plan.

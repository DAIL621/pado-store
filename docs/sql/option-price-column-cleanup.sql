-- PREPARED ONLY. Run only after the column-based application has been deployed and verified.
begin;

-- Preserve the dedicated backup table. Remove only the temporary JSON dependency.
update public.products
set detail_json = coalesce(detail_json, '{}'::jsonb) - 'optionPricing'
where coalesce(detail_json, '{}'::jsonb) ? 'optionPricing';

commit;

-- Verification:
-- select count(*) from public.products where coalesce(detail_json, '{}'::jsonb) ? 'optionPricing'; -- expected 0


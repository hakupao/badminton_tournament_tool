# Supabase Integration Runbook

## Step 1 – Initialize Supabase Project
- **Analysis** *(status: completed 2025-11-05)*: Reviewed existing localStorage entities and mapped them to Supabase tables; recorded schema in `docs/supabase_schema.sql`.
- **Execution** *(status: in_progress)*: Supabase SQL templates prepared (`docs/supabase_schema.sql`); awaiting project creation and credential storage once Supabase account access is available.
- **Verification** *(status: blocked)*: Pending Supabase project provisioning to validate tables/RLS and smoke-test auth sign-in.
- **Closure** *(status: blocked)*: Will document final auth settings and credential vault location after verification completes.

## Step 2 – Configure Local & Deployment Environments
- **Analysis** *(status: completed 2025-11-05)*: Confirmed no existing Vite env variables; planned Supabase env names to avoid collisions.
- **Execution** *(status: in_progress)*: Added `@supabase/supabase-js`, created `frontend/.env.example` with required keys, and verified `.gitignore` coverage; pending population of real secrets in `.env.local` and Vercel.
- **Verification** *(status: blocked)*: Awaiting real credentials to validate dev server reads `import.meta.env`.
- **Closure** *(status: blocked)*: Will add key rotation/runbook notes once verification passes.

## Step 3 – Wrap Supabase Client
- **Analysis** *(status: completed 2025-11-05)*: Defined shared access patterns, offline fallback expectations, and consumer touchpoints (store, data service, pages).
- **Execution** *(status: completed 2025-11-05)*: Implemented `frontend/src/lib/supabaseClient.ts` with normalized `runSupabase`/`runMutations` helpers and exported configuration guards.
- **Verification** *(status: blocked)*: Awaiting live Supabase project to run smoke test against `runSupabase`.
- **Closure** *(status: blocked)*: Architecture notes pending once verification confirms single entry point usage.

## Step 4 – Manage Auth State
- **Analysis** *(status: completed 2025-11-05)*: Reviewed existing `AppProvider` store usage and confirmed all routes should observe auth while preserving offline fallback.
- **Execution** *(status: completed 2025-11-05)*: Added `AuthProvider`, `AuthGate`, header status indicators, and sign-out handling; routes now guarded when Supabase is configured.
- **Verification** *(status: blocked)*: Pending Supabase credentials to test OTP login, refresh persistence, and access control.
- **Closure** *(status: blocked)*: Will document onboarding/login UX after verification results.

## Step 5 – Migrate Data Access Layer
- **Analysis** *(status: completed 2025-11-05)*: Catalogued localStorage usage across pages and identified shared persistence needs for matches, config, players, formations, schedule, and slots.
- **Execution** *(status: completed 2025-11-05)*: Added `frontend/src/services/dataService.ts` with Supabase CRUD + offline fallback and rewired `AppProvider` to persist via the service.
- **Verification** *(status: blocked)*: Awaiting Supabase project to live-test CRUD + fallback; current coverage limited to localMode via `npm run build`.
- **Closure** *(status: in_progress)*: Legacy component updates underway; schedule/match views still rely on localStorage pending refactor before updating diagrams.

## Step 6 – Default Data Import Flow
- **Analysis** *(status: completed 2025-11-05)*: Reviewed default bundle schema and new import marker requirements.
- **Execution** *(status: completed 2025-11-05)*: Replaced local seeder with async `ensureDefaultDataSeeded` leveraging the data service and Supabase import state table.
- **Verification** *(status: blocked)*: Needs Supabase environment to validate first-login seeding and rollback handling.
- **Closure** *(status: in_progress)*: Documenting re-trigger steps and conflict resolution for final docs.

## Step 7 – Update Pages & State
- **Analysis** *(status: ready)*: Catalog components that currently depend on local storage data and their loading or error assumptions.
- **Execution** *(status: ready)*: Refactor pages to call the centralized data service, propagate loading and error UI, and adjust save flows to await Supabase mutations before updating caches.
- **Verification** *(status: ready)*: Walk through core user journeys (configure tournament, edit matches, view schedules) ensuring state stays consistent across reloads.
- **Closure** *(status: ready)*: Log any remaining legacy paths and plan subsequent cleanups.

## Step 8 – Stats & Reports Adaptation
- **Analysis** *(status: ready)*: Identify computations that can remain client-side versus those better handled by Supabase views or edge functions.
- **Execution** *(status: ready)*: Update any heavy aggregations to use Supabase SQL or edge functions where justified and adjust `data-utils.ts` to pull from the new sources.
- **Verification** *(status: ready)*: Compare report outputs before and after migration for the same dataset.
- **Closure** *(status: ready)*: Document performance considerations and data sources for each report.

## Step 9 – Testing & Validation
- **Analysis** *(status: ready)*: Define coverage goals (manual scripts and automated tests) aligned with the new data flow and auth paths.
- **Execution** *(status: ready)*: Implement or update tests for auth, initial import, CRUD flows, caching fallback, and multi-account isolation; run through the manual regression script end to end.
- **Verification** *(status: ready)*: Ensure the CI or local test suite passes; collect screenshots and logs for manual checks.
- **Closure** *(status: ready)*: Archive test evidence and note any gaps requiring follow-up.

## Step 10 – Launch & Operations
- **Analysis** *(status: ready)*: Review the deployment pipeline for Supabase dependencies and monitoring hooks.
- **Execution** *(status: ready)*: Update documentation with the new architecture, configure backups, set up monitoring and alerts for Supabase and Vercel, and prepare rollback steps.
- **Verification** *(status: ready)*: Validate preview deployments read environment variables correctly and smoke-test the production stack post-release.
- **Closure** *(status: ready)*: Hold a release retrospective and record operational runbooks.

## Open Questions
- Confirm the expected Supabase project region and SLA requirements (affects latency and backup strategy).
- Clarify whether multi-tenant support beyond `auth.uid()` scoping is needed (for example, admin access or shared tournaments).
- Verify if there is an existing backend or cloud function layer that must stay in sync with the new Supabase data flow.

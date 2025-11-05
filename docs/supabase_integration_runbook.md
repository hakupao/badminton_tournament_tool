# Supabase Integration Runbook

## Step 1 – Initialize Supabase Project
- **Analysis** *(status: ready)*: Review desired auth methods, region, table retention, and confirm schema fields against current frontend needs.
- **Execution** *(status: ready)*: Create the Supabase project, record `Project URL` and anon/service keys, configure auth providers, and create tables (`tournament_configs`, `players`, `matches`, `time_slots`, `formations`, `schedules`) with shared `user_id` and timestamp columns.
- **Verification** *(status: ready)*: Use Supabase table editor or SQL to confirm schemas and RLS defaults; ensure an auth test user can sign in via the chosen provider.
- **Closure** *(status: ready)*: Capture schema DDL, auth settings, and credential storage location in the project documentation.

## Step 2 – Configure Local & Deployment Environments
- **Analysis** *(status: ready)*: Inspect existing `.env` usage in the Vite frontend and deployment pipeline to avoid collisions.
- **Execution** *(status: ready)*: Install `@supabase/supabase-js`, add `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, extend `.gitignore`, and mirror environment variables in Vercel.
- **Verification** *(status: ready)*: Run `npm run dev` and ensure environment variables load via `import.meta.env`.
- **Closure** *(status: ready)*: Document how to rotate keys and update environment variables across environments.

## Step 3 – Wrap Supabase Client
- **Analysis** *(status: ready)*: Map out shared data access concerns (error handling, retries, logging) and note consumers that will reuse the client.
- **Execution** *(status: ready)*: Create `frontend/src/lib/supabaseClient.ts` to read environment variables, call `createClient`, and expose typed CRUD helpers plus a normalized error and result format.
- **Verification** *(status: ready)*: Write a lightweight smoke test or story to exercise one helper against Supabase.
- **Closure** *(status: ready)*: Update architecture notes to show the new client module as the single entry point.

## Step 4 – Manage Auth State
- **Analysis** *(status: ready)*: Review existing global state patterns and routes needing protection.
- **Execution** *(status: ready)*: Build an Auth provider that subscribes to `auth.onAuthStateChange`, maintains `{ user, isLoading }`, and exposes `signIn` and `signOut`; surface login and logout UI and guard restricted screens.
- **Verification** *(status: ready)*: Log in and out through the UI, refresh, and ensure state persists; confirm unauthenticated access is blocked where required.
- **Closure** *(status: ready)*: Note auth UX patterns and update onboarding documentation with the new sign-in flow.

## Step 5 – Migrate Data Access Layer
- **Analysis** *(status: ready)*: Inventory modules currently reading or writing `localStorage`, especially `frontend/src/data/defaultDataLoader.ts`, and plan phased replacement.
- **Execution** *(status: ready)*: Implement `frontend/src/services/dataService.ts` using the Supabase helpers for CRUD on matches, configs, formations, players, and time slots while retaining an offline `localStorage` fallback.
- **Verification** *(status: ready)*: Unit-test or manually probe service methods to confirm Supabase writes and reads as well as cache fallback behavior.
- **Closure** *(status: ready)*: Mark legacy direct storage calls for removal and update dependency diagrams.

## Step 6 – Default Data Import Flow
- **Analysis** *(status: ready)*: Understand the existing seeding logic in `frontend/src/data/defaultDataLoader.ts` and the structure of `default-data.json`.
- **Execution** *(status: ready)*: Create a migration routine that, on first authenticated load with empty Supabase tables, decomposes the default bundle and writes batched records; persist an “imported” marker per user.
- **Verification** *(status: ready)*: Clean Supabase tables, log in as a new user, ensure data populates once, and verify rollback and alert paths on failure.
- **Closure** *(status: ready)*: Record how to re-trigger seeding for troubleshooting and how conflicts are handled.

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

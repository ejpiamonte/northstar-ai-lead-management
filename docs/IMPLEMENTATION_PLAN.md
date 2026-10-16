# Implementation Plan and Readiness

## Current state

The portfolio flow and the `/admin` workflow demo are implemented. Demo Mode is enforced by the lead API route; Supabase persistence is active when configured and the Small business scenario is selected; email and appointment actions are mock records.

Portfolio polish (2026-10-17), implemented and tested locally:

- Scoring, tier, routing, and email drafting extracted from the route into `lib/engine/` with unchanged rules. Routing gained an optional territory preference used only by the enterprise demo.
- Every `/admin` page now reads a generated, fictional demo pipeline (`lib/demo/generate.ts`) through `lib/data.ts`. No admin route queries Supabase, which closes the unauthenticated-admin exposure described below.
- Small business (3 reps) and Enterprise (12 reps, three territories) scenarios with a switch, shareable `?scenario=` links (`proxy.ts`), a guided tour, KPIs, charts, funnel, team workload, an illustrative impact estimate, filterable leads, and a How it works page.
- The public form offers one-click sample enquiries and shows what the automation did (score breakdown, tier rule, owner and routing reason, drafted reply, step trace). Without Supabase, or in the enterprise scenario, the route runs the same pipeline in memory and stores nothing.
- `tests/engine.test.ts` (13 tests) covers budget parsing, score breakdown, tier rules, capacity fallback, territory routing, the in-memory pipeline, and demo-data consistency. Prettier and `typecheck` scripts were added. ESLint is not configured because typescript-eslint does not yet support TypeScript 7. The shared-project SQL is prepared locally but hosted inspection/execution and cross-application verification are not confirmed.

## Priorities

### P0 — Resolve before public deployment with Supabase credentials

- Resolved 2026-10-17: the nested `/admin` routes no longer query the database; they read generated demo data only. Before showing real submissions in any admin view, add authentication and authorization first.
- Review access to `POST /api/webhook/lead`: add appropriate rate limiting or abuse controls before accepting public submissions at scale.
- Confirm the deployed schema and service-role environment are correct; use synthetic data for deployment checks.

### P1 — Improve operational readiness

- Define retention/deletion and backup/recovery procedures for form submissions.
- Engine tests exist (`npm test`). Still missing: route-level tests for duplicate submissions and Supabase persistence failures.
- Add monitoring that avoids logging submitted personal data and documents operational response.
- Verify accessibility and mobile behavior on the actual deployed UI.

### P2 — Optional shared database setup

1. Run `supabase/shared/inspect_destination.sql` in the intended project and compare actual schema/policies with all app source definitions.
2. Back up the target and separately plan any required historical data or file transfer.
3. Review the additive SQL and execute it only after confirming the intended target and approval. Use the empty bootstrap only for a truly empty project.
4. Verify effective table grants/policies, bucket privacy and restrictions, and each app's workflows with synthetic fixtures.

This documentation update does not execute SQL or change hosted resources.

## Acceptance criteria for a safe portfolio release

- The public dashboard contains only clearly synthetic examples.
- No unauthenticated route can read stored lead, activity, email, run, appointment, or team records.
- Demo submissions clearly disclose persistence; provider calls remain disabled unless separately designed and reviewed.
- Supabase schema and access controls have been verified in the target environment.
- Deployment smoke tests use synthetic records and confirm expected success/error behavior.

## Verification status

This update is documentation-only. Repository source and SQL were inspected; no hosted database, Vercel project, or external provider was contacted. The Git working tree state is reviewed separately at handover. No SQL execution, deployment, or integration smoke test is claimed.

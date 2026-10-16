# Architecture

Northstar Digital is a fictional agency used to demonstrate inbound lead qualification and sales routing. This document describes the current repository implementation; it does not assert hosted deployment or external integration status.

## Request flow

```text
Public lead form
  → POST /api/webhook/lead
  → validate request
  → enforce Demo Mode
  → enterprise scenario or no Supabase configured: run lib/engine/pipeline.ts in memory and return the result (nothing stored)
  → otherwise persist lead and automation run in Supabase
  → deterministic analysis and tier classification
  → choose a salesperson by tier fit and workload
  → persist run/activity and mock email/appointment records
  → return score, tier, assignment, run identifiers, and an explanation (score breakdown, tier rule, routing reason, drafted reply, steps)
```

## Components

- `app/page.tsx` and `components/LeadForm.tsx`: landing page and visitor form.
- `app/api/webhook/lead/route.ts`: validation and workflow orchestration.
- `lib/supabase/admin.ts`: server-side Supabase service-role client.
- `lib/engine/`: schema, scoring (`scoreLead`, `mockAnalysis`), tier and routing rules (`classifyTier`, `chooseSalesperson`), and the in-memory pipeline. Shared by the API route, the demo generator, and the tests.
- `lib/scenarios.ts`: Small business and Enterprise teams, volumes, and response targets.
- `lib/demo/generate.ts`: deterministic 30-day demo pipeline built with the real engine; `lib/data.ts` serves it to `/admin`; `lib/insights.ts` computes dashboard metrics.
- `app/admin/*`: overview, leads (list and detail), meetings, run history, email log, sales team, and how it works. All read demo data only.
- `proxy.ts`: `?scenario=smb|enterprise` sets the scenario cookie and redirects.
- `supabase/migrations/001_northstar_init.sql`: Northstar schema and fictional seed reps.
- `n8n/northstar-lead-workflow.json`: separate illustrative workflow export, not invoked by Next.js.

## Important route exposure

As of 2026-10-17 no `/admin` route queries the database. All of them read the generated demo pipeline through `lib/data.ts`, so deploying with Supabase credentials no longer exposes stored submissions through the admin area. There is still no authentication; add it before building any view of real records.

## Security boundaries

Northstar enables RLS without public policies. The server service-role client bypasses RLS, so RLS does not prevent that client from reading or writing records. Demo Mode is forced in the API path; provider-related code exists but the public path does not contact OpenAI or send email. The form stores visitor submissions; use synthetic data and keep secrets out of client bundles and Git.

## Related references

- [Product requirements](PRD.md)
- [Technical reference](TRD.md)
- [Workflow](APP_FLOW.md)
- [Database schema and shared SQL](DATABASE_SCHEMA.md)
- [Readiness plan](IMPLEMENTATION_PLAN.md)

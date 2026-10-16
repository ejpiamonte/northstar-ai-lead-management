# Northstar Digital — Lead Qualification Demo

Northstar is a portfolio project demonstrating an inbound lead workflow: capture an enquiry, score it with deterministic demo rules, assign a fictional sales specialist, and record workflow activity. Northstar Digital and all example people and leads are fictional.

## Try the demo in 2 minutes

No database or API keys are needed. Run `npm install` and `npm run dev`, then open http://localhost:3000.

1. On the home page, click a **sample enquiry** (logistics automation, clinic portal, or website fix) and send it. You see the score and what made it up, the tier rule that fired, who it was routed to and why, the drafted reply, and the step-by-step trace.
2. Open the **workflow demo** (/admin). Follow the three-step tour: a high-value enquiry, a small support request, then your own.
3. Switch **Small business / Enterprise** in the header. The same rules run a 3-person team and a 12-rep team with North America, EMEA, and APAC territories.
4. Open **Leads** to filter by tier, owner, status, or territory, and open any lead to see why it was routed. **Sales team** shows workload against capacity and follow-up times.

Share a specific view with `?scenario=smb` or `?scenario=enterprise`, for example `/admin?scenario=enterprise`.

## Small business and enterprise scenarios

| | Small business | Enterprise |
| --- | --- | --- |
| Team | Northstar Digital, 3 specialists (one per tier) | Northstar Group, 12 reps in 3 territories |
| Volume | about 48 leads a month | about 900 a month (260-lead sample shown) |
| Routing | tier owner, then least-loaded backup | territory first, then tier owner, then backup |
| High-tier follow-up target | 1 hour | 15 minutes |

Both run the same engine in `lib/engine/` (scoring, tier rules, capacity-aware routing). Team definitions are in `lib/scenarios.ts`.

## What the demo does

- The public form sends a request to `POST /api/webhook/lead`. The server validates it, scores it with a deterministic analyzer, applies tier and workload routing, drafts the emails, and proposes a call for high-tier leads.
- With Supabase configured and the Small business scenario selected, the lead and workflow records are written to Supabase. Otherwise (no database, or the Enterprise scenario) the same pipeline runs in memory and nothing is stored.
- Email and appointment actions are mock logs or proposals. The public path does not contact OpenAI, Resend, Slack, or a calendar provider.
- `/admin` is a read-only workflow demo built from a generated, fictional 30-day pipeline. **No admin page queries the database**, so visitor submissions are never shown there. Showing real leads would need authentication and authorization first.

Impact figures on the dashboard are illustrative estimates from editable assumptions, not measured results.

Form submissions may be stored in the configured Supabase project. Use synthetic, non-sensitive information only. RLS is enabled on the app tables, but the server uses a service-role key that bypasses RLS.

## Run locally

Prerequisites: Node.js 20.9+ and npm.

1. Run `npm install`.
2. Optional, only to store form submissions: copy `.env.example` to `.env.local` and set the Supabase URL and service-role key for a project with the Northstar schema installed. Without them the demo runs fully in memory.
3. For a new, dedicated project only, inspect and run `supabase/migrations/001_northstar_init.sql` in the Supabase SQL Editor. Do not replay it on a database where the objects already exist.
4. Run `npm run dev` and open `http://localhost:3000`.
5. Submit synthetic form data to demonstrate processing. Open `/admin` for the static sample dashboard.

Available scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run typecheck`, `npm test` (engine and demo-data tests), and `npm run format`. There is no lint script yet because typescript-eslint does not support TypeScript 7.

## Configuration

| Variable | Required for submissions | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. Used by server-side code in this app. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only database access. Never expose it to browser code or commit it. |

The route enforces Demo Mode in code. OpenAI and Resend branches exist in the source but are not active in the public request path; setting provider credentials does not make this demo live.

## Deployment

This repository can be imported by a Next.js hosting provider such as Vercel. It also deploys without any environment variables, in which case form submissions run in memory and nothing is stored. Before enabling a public deployment with Supabase credentials, add rate limiting to the lead endpoint, then configure the two server environment variables, apply/verify the schema, deploy, and smoke-test using synthetic data. Hosting-provider deployment has not been verified as part of this documentation update.

## Documentation

- [Product requirements](docs/PRD.md)
- [Technical reference](docs/TRD.md)
- [Workflow](docs/APP_FLOW.md)
- [Design brief](docs/DESIGN_BRIEF.md)
- [Northstar and shared database schema/setup](docs/DATABASE_SCHEMA.md)
- [Implementation plan and risks](docs/IMPLEMENTATION_PLAN.md)
- [Architecture and route notes](docs/ARCHITECTURE.md)

## Project map

- `app/page.tsx`, `components/LeadForm.tsx` — public landing page and form.
- `app/api/webhook/lead/route.ts` — validation, Demo Mode enforcement, persistence (when configured), and mock actions.
- `lib/engine/` — scoring, tier rules, routing, and the in-memory pipeline.
- `lib/scenarios.ts`, `lib/demo/generate.ts`, `lib/data.ts`, `lib/insights.ts` — demo teams, generated pipeline, and dashboard metrics.
- `app/admin/` — workflow demo pages (overview, leads, meetings, runs, emails, team, how it works), all reading demo data only.
- `tests/engine.test.ts` — engine and demo-data tests.
- `supabase/migrations/001_northstar_init.sql` — Northstar schema for a dedicated empty project.
- `supabase/shared/` — read-only inspection and separately reviewed shared-database SQL. These scripts have not been confirmed against hosted state or executed as part of this documentation update.
- `n8n/northstar-lead-workflow.json` — separate illustrative workflow export; not invoked by the Next.js app.

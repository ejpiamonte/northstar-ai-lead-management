# Technical Reference — Northstar

## Architecture

Next.js App Router application using React and TypeScript. The browser form posts to `POST /api/webhook/lead`; that Node.js route validates and orchestrates the demo workflow, using `@supabase/supabase-js` with a server-side service-role client. Zod validates request and analyzer structures. The public `/admin` page uses static sample data. Tailwind CSS supplies styling.

## Runtime and configuration

Node.js 20.9+ and npm. Environment variables are documented in the root `.env.example`: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Despite the public prefix in the URL variable, the current client module is server-side; do not import the privileged client into browser code. No deployment environment has been independently verified.

## API

`POST /api/webhook/lead` accepts JSON fields `full_name`, `email`, `message` (required), and optional `company`, `phone`, `service_interest`, `budget_range`, `timeline`, `source`. The route imposes length/format bounds using Zod, creates a lead/run, computes a deterministic analysis, routes it, and records mock email/appointment actions. The response includes workflow identifiers and routing outcome. Invalid JSON/body/fields and persistence failures return error responses. Current duplicate detection is advisory and does not prevent another insert. There is no confirmed rate limiting.

## Data and access control

The Northstar schema has seven public tables: `app_settings`, `salespeople`, `leads`, `automation_runs`, `lead_activities`, `appointments`, and `email_logs`. RLS is enabled without client policies in the Northstar migration. The API uses the service-role key and therefore bypasses those policies. Most legacy nested admin pages also use this privileged server client without authentication; this is a critical exposure if deployed with real submissions.

The optional shared database scripts define additional LedgerLens tables, a guestbook, and a private storage bucket. See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md); these are shared-project setup artifacts, not dependencies of the Northstar app itself.

## Integrations and boundaries

- Supabase is the active persistence dependency for submissions.
- OpenAI, Resend, calendar, and Slack are not contacted by the enforced public Demo Mode route. Provider-related code and a separate n8n export are not evidence of a live integration.
- `n8n/northstar-lead-workflow.json` is an inactive, separate illustrative export with credential placeholders.

## Operational gaps

Engine tests run with `npm test` (tsx and node:test); `npm run typecheck` and `npm run format` are available. No lint script is declared because typescript-eslint does not yet support TypeScript 7. Rate limiting, retention/deletion operations, production monitoring, and authenticated administration are not established by this repository. Confirm hosted schema and access behavior before using a real Supabase project.

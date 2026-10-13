# Northstar Digital · Lead Qualification Demo

A portfolio project that demonstrates an automated inbound lead workflow: capture an enquiry, qualify it, apply deterministic tier rules, route it to a sales specialist, and record the steps taken.

Northstar Digital and every lead/team record shown in the portfolio dashboard are fictional. The dashboard at `/admin` is a static, read-only illustration and never reads visitor submissions or the database. Subroutes such as `/admin/leads` redirect to that safe dashboard.

## Demo behavior

- Public form submissions always use the built-in deterministic analyzer. A request cannot switch the app into live mode.
- The public API stores form submissions and workflow records in Supabase to demonstrate the pipeline. The admin dashboard does not display those records.
- The portfolio demo does not call OpenAI, Resend, Slack, or a calendar provider. Email and appointment actions are mock records only.
- Do not use real customer or sensitive personal information in the public demo. The form tells visitors that demo submissions are stored.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Supabase values.
3. Run `supabase/migrations/001_northstar_init.sql` in the Supabase SQL editor.
4. Start the app with `npm run dev` and open `http://localhost:3000`.
5. Use the public form to exercise the demo pipeline. Open `/admin` for the sanitized portfolio walkthrough.

`npm run build` creates the production build, and `npm run start` serves it locally.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes for form submissions | Supabase project URL. Despite the `NEXT_PUBLIC_` prefix, it is only used by server-side code here. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for form submissions | Server-only key used by the API route. Never expose it in browser code or commit it. |

OpenAI and Resend credentials are intentionally not required for this portfolio deployment. The endpoint enforces Demo Mode and will not call those providers.

## Deploy to Vercel

1. Put the project in a GitHub, GitLab, or Bitbucket repository. The Vercel Git integration uses commits to build deployments and previews.
2. Import the repository in Vercel. It should detect Next.js automatically; keep the default install and build commands.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project settings for the environments where form submissions should work.
4. Apply the Supabase migration before testing the form. Keep the service-role key server-side and out of Git.
5. Deploy, then verify the landing page, form validation, a sample submission, and `/admin`.

Without Supabase environment variables, the landing page and static demo dashboard can still render, but form submissions return a configuration error.

## Project map

- `app/page.tsx` — public landing page and contact form.
- `components/LeadForm.tsx` — browser form with validation feedback.
- `app/api/webhook/lead/route.ts` — server-side validation, Demo Mode scoring, assignment, mock message logging, and run audit trail.
- `app/admin/page.tsx` — curated, synthetic, read-only portfolio dashboard.
- `supabase/migrations/001_northstar_init.sql` — database schema, indexes, RLS defaults, and fictional team records.
- `data/seed-leads.json` — detailed fictional workflow fixture data.
- `n8n/northstar-lead-workflow.json` — illustrative n8n workflow export; credentials must be configured in n8n and the export is not required to run the Next.js demo.
- `docs/ARCHITECTURE.md` — architecture and routing rules.


## Shared Supabase setup

To share the existing Northstar project with LedgerLens and Niven, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Inspect hosted metadata before applying [the additive SQL](supabase/shared/002_add_to_existing_northstar.sql). The empty bootstrap is for empty destinations only. No existing records or files are imported. SQL execution against Supabase remains pending.

# Architecture

Northstar Digital is a fictional agency used to demonstrate an automated lead-qualification and sales-routing system.

## Request flow

```text
Public lead form
    → POST /api/webhook/lead
    → validate fields and check for recent duplicate submissions
    → persist the lead and automation run in Supabase
    → deterministic mock analysis (Demo Mode is enforced server-side)
    → apply tier rules and choose an available salesperson
    → log mock email drafts and proposed appointments
    → return the score, tier, and assigned specialist
```

The service-role key is only read by server-side modules. Supabase tables have row-level security enabled with no public policies. Public form data is written through the server route; it is not displayed in the portfolio dashboard.

## Portfolio dashboard

`/admin` is a curated, read-only page with synthetic example records and explanatory routing rules. It does not query Supabase and it does not render contact details or visitor submissions. The old operational console paths redirect to `/admin`. Keep these routes this way unless real authentication and authorization are added first.

## Demo safety

- The API always selects Demo Mode; request payloads and headers cannot select Live mode.
- The analyzer is deterministic and local. Email and calendar actions are written as mock logs only.
- The public form tells visitors that submissions are stored to demonstrate the workflow.
- Do not submit real or sensitive personal information to the portfolio deployment. Consider adding a rate limit or CAPTCHA before sharing it broadly.

## Tier and assignment rules

| Order | Rule | Tier | Primary rep |
| --- | --- | --- | --- |
| 1 | Score 75 or higher | High | Sarah |
| 2 | AI automation with budget at least $10,000 | High | Sarah |
| 3 | Support request with budget under $2,500 | Low | Maria |
| 4 | Score 40 to 74 | Mid | Alex |
| 5 | Anything else | Low | Maria |

If the primary rep is at capacity, the system checks the fixed fallback order, sorts eligible candidates by open workload and name, then uses the least-loaded rep if all are at capacity.

## Supabase setup

Run `supabase/migrations/001_northstar_init.sql` in the Supabase SQL editor. Configure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server environment variables. Never commit `.env.local` or expose the service-role key in client-side code.

The n8n JSON file is a separate illustrative export. It is not used by the Next.js webhook and requires its own credentials and setup if imported into n8n.

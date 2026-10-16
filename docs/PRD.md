# Product Requirements — Northstar Lead Qualification Demo

## Purpose

Demonstrate, for a software portfolio, how an inbound enquiry can be validated, qualified with explainable rules, assigned by fit and workload, and recorded as an auditable workflow. Northstar Digital, its team, and all dashboard examples are fictional.

## Users and outcomes

- **Portfolio reviewer:** can understand the workflow and inspect synthetic examples without seeing real visitor data.
- **Demo visitor:** can submit a sample enquiry and see confirmation that demo processing occurred.
- **Maintainer:** can configure Supabase, inspect stored runs, and operate the project safely.

Success means the workflow and its deterministic decisions are understandable, the demo is clearly labeled, and no visitor submission or secret is exposed by public portfolio views.

## Scope

Implemented: public contact form, server-side payload validation, deterministic demo qualification, tier classification, workload-aware fictional rep selection, Supabase persistence and run-step logging, mock email/appointment records, and a static `/admin` sample dashboard.

Not active in the public path: real AI analysis, real email delivery, calendar booking, Slack notification, authenticated staff console, or the separate n8n export. The project contains some provider-related source code, but this does not make those integrations operational in Demo Mode.

## Requirements

1. Validate and bound form values before persistence.
2. Force Demo Mode server-side; a request must not be able to select live providers.
3. Apply deterministic, reviewable score/tier rules and route to an active salesperson using workload and fallback rules.
4. Record the lead, analysis, run steps, and mock actions for demonstration.
5. Keep every `/admin` page synthetic and read-only (generated demo data, no database reads).
6. Clearly disclose that submissions are stored; use non-sensitive synthetic data for demonstrations.
7. Protect any database-backed staff views with authentication and authorization before public deployment.

## Constraints and open items

- Supabase service-role credentials bypass RLS; server-only use and route authorization are essential.
- Resolved 2026-10-17: admin routes no longer read live tables. Authentication is still required before any view of real records is added.
- There is no verified hosted schema or hosting deployment state in this checkout.
- Rate limiting/CAPTCHA and a retention/deletion policy are not implemented or confirmed.

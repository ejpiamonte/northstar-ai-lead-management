# Database Schema and Shared Supabase Setup

## Northstar schema

The source of truth for the Northstar schema is [`supabase/migrations/001_northstar_init.sql`](../supabase/migrations/001_northstar_init.sql). It defines seven tables:

| Table | Purpose |
| --- | --- |
| `app_settings` | Key/value settings, including a seeded demo-mode setting. |
| `salespeople` | Fictional reps, specialties, tier focus, capacity, and calendar URL. |
| `leads` | Submitted lead details, status, score, analysis, and assignment. |
| `automation_runs` | One workflow execution and its JSON step trace. |
| `lead_activities` | Human-readable timeline entries linked to leads/runs/reps. |
| `appointments` | Proposed/confirmed appointment records. |
| `email_logs` | Mock or outbound email record and status. |

The migration includes foreign keys, checks, indexes, `updated_at` triggers, enables RLS on all seven tables, and seeds demo settings and three fictional reps. It does not create public client policies. Server access uses the service-role key, which bypasses RLS.

## Dedicated Northstar database

For an empty, dedicated project, review the migration and execute it once in Supabase SQL Editor. Do not replay it against an installed schema: it uses ordinary `CREATE TABLE` statements and is not an idempotent upgrade script. Verify tables, RLS, and seed records before configuring the app. No hosted execution is confirmed here.

## Optional shared-project SQL

The following files are prepared for a separate shared Supabase setup involving Northstar, LedgerLens, and Niven; they are not required to run the Northstar portfolio app. Their definitions and project-specific prerequisites have not been verified against the live hosted database in this checkout.

- [`inspect_destination.sql`](../supabase/shared/inspect_destination.sql) — read-only inventory of public relation names/RLS, policies, and the named Storage bucket. It does not inspect full column compatibility or grants.
- [`002_add_to_existing_northstar.sql`](../supabase/shared/002_add_to_existing_northstar.sql) — intended additive path; preflights expected object names and creates eleven LedgerLens tables plus `guestbook`, seeds LedgerLens settings/sample purchase orders, adds indexes and access rules, and creates a private invoice bucket with file restrictions. Name-level checks do not prove column-level compatibility.
- [`001_bootstrap_empty.sql`](../supabase/shared/001_bootstrap_empty.sql) — full bootstrap for an empty destination only. Do not use on an existing project.

Northstar contributes seven tables; the prepared shared setup adds twelve, for nineteen app tables total. The SQL is transactional, but hosted state, rollback, effective grants, data preservation, and app behavior must be verified against the target project before calling the setup deployed. No SQL is run by this documentation.

The shared SQL describes LedgerLens tables and a Niven guestbook. Those other applications are outside this repository; compare their own source migrations/setup and current hosted schema before relying on those definitions. No records, uploaded files, or auth users are transferred by these scripts.

## Security and operations

All apps using the same service-role key share a privileged trust boundary. Keep the key server-side, out of Git, and rotate it if exposed. RLS alone does not protect requests made through service-role clients. Northstar's current unauthenticated nested admin routes use privileged database access and can expose stored submissions; see [Implementation Plan](IMPLEMENTATION_PLAN.md). Retention, deletion, backup, and recovery procedures for submitted data are not defined here.

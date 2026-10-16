# Application Flow

## Public lead submission

```text
Visitor fills form
  → browser submits JSON to POST /api/webhook/lead
  → server parses and validates input
  → server forces Demo Mode
  → if the visitor chose the Enterprise scenario, or Supabase is not configured:
      run the same pipeline in memory, return the result, store nothing
  → check for a recent matching email (informational; duplicates are still accepted)
  → insert lead and automation run
  → deterministic heuristic analysis
  → classify tier and choose an active rep by tier fit/workload
  → persist analysis, run steps, and activity
  → create mock email logs and, for high-tier leads, a proposed appointment record
  → return run/lead identifiers, tier, score, and assignee
```

The form displays an error for unsuccessful responses. On success it shows what happened: score and its breakdown, tier rule, assigned rep and routing reason, the drafted reply, the proposed call for high-tier leads, the step trace, and whether the submission was stored. Three sample buttons fill the form with a high-, mid-, and low-tier enquiry. Use synthetic information only.

## Qualification and routing

The analyzer uses service/message text, budget, urgency/timeline, and completeness signals to produce a bounded score and category. Tier rules run in order: score at least 75 → high; AI automation with budget at least USD 10,000 → high; support request below USD 2,500 → low; score at least 40 → mid; otherwise low. Assignment follows a tier-specific fallback order, filters active reps by capacity where possible, then sorts by open workload and name. If all are at capacity, it assigns the least-loaded eligible rep.

## Failure handling and limits

Malformed JSON and invalid fields are rejected. Processing steps record success/failure details in the automation run; a processing error marks the run failed where possible and returns an error. The recent-duplicate lookup does not provide idempotency: repeated submissions may create multiple leads. There is no confirmed retry queue, rate limiter, CAPTCHA, or external-provider retry path in the active Demo Mode flow. Some activity-log persistence failures are logged rather than failing the full response.

## Separate artifacts

The n8n export is not part of this request path. It must be independently configured and reviewed before use; its presence does not mean the Next.js app invokes n8n.

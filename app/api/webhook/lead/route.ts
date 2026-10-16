import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin';
import type { AutomationStep, RunMode, StepStatus } from '@/lib/automation-types';
import { ANALYSIS_JSON_SCHEMA, AnalysisSchema, LeadInput, type Analysis } from '@/lib/engine/schema';
import { mockAnalysis, scoreLead } from '@/lib/engine/scoring';
import { chooseSalesperson, classifyTier, type Salesperson } from '@/lib/engine/routing';
import { nextBusinessDayAt, runLeadPipeline } from '@/lib/engine/pipeline';
import { currentOpenCounts } from '@/lib/demo/generate';
import { parseScenarioId, SCENARIO_COOKIE, SCENARIOS } from '@/lib/scenarios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ------------------------------------------------------------------ */
/* Types and small helpers                                             */
/* ------------------------------------------------------------------ */

interface ActivityInsert {
  activity_type: string;
  title: string;
  description?: string;
  salesperson_id?: string;
  metadata?: Record<string, unknown>;
}

interface StepResult<T> {
  value: T;
  status?: StepStatus;
  detail?: string;
  output?: Record<string, unknown>;
}

class ValidationError extends Error {}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function must<T>(res: { data: T | null; error: { message: string } | null }, context: string): T {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  if (res.data === null) throw new Error(`${context}: no data returned`);
  return res.data;
}

async function runStep<T>(
  steps: AutomationStep[],
  key: string,
  label: string,
  fn: () => Promise<StepResult<T>>,
): Promise<T> {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  try {
    const result = await fn();
    steps.push({
      key,
      label,
      status: result.status ?? 'success',
      started_at: startedAt,
      duration_ms: Math.round(performance.now() - t0),
      detail: result.detail,
      output: result.output,
    });
    return result.value;
  } catch (err) {
    steps.push({
      key,
      label,
      status: 'failed',
      started_at: startedAt,
      duration_ms: Math.round(performance.now() - t0),
      detail: errMsg(err),
    });
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* OpenAI structured analysis                                          */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You qualify inbound leads for Northstar Digital, an agency that sells AI workflow automation, custom web applications, websites, and support retainers.
Return JSON that matches the provided schema exactly.
Scoring rubric for "score" (0-100): fit with our services (0-40), budget (0-30), urgency (0-15), completeness and seriousness of the message (0-15).
Use estimated_budget_usd as your best single-number estimate in US dollars (midpoint of a range), or 0 if unknown.
"confidence" is how sure you are about the category and score (0-1).
suggested_reply_body must start with "Hi <first name>," and contain no signature, because the sender is added later. Keep it under 120 words and do not promise prices.`;

async function openAiAnalysis(input: LeadInput): Promise<{ analysis: Analysis; model: string }> {
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create(
    {
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            full_name: input.full_name,
            company: input.company ?? null,
            service_interest: input.service_interest ?? null,
            budget_range: input.budget_range ?? null,
            timeline: input.timeline ?? null,
            message: input.message,
          }),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'lead_analysis', strict: true, schema: ANALYSIS_JSON_SCHEMA },
      },
    },
    { timeout: 25_000, maxRetries: 1 },
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('OpenAI returned an empty response');
  return { analysis: AnalysisSchema.parse(JSON.parse(raw)), model };
}

/* ------------------------------------------------------------------ */
/* Email and scheduling helpers                                        */
/* ------------------------------------------------------------------ */

async function sendViaResend(from: string, to: string, subject: string, text: string): Promise<string | undefined> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Resend responded with ${res.status}`);
  const json = (await res.json()) as { id?: string };
  return json.id;
}

/* ------------------------------------------------------------------ */
/* In-memory path: no database configured, or the enterprise demo       */
/* ------------------------------------------------------------------ */

type Breakdown = ReturnType<typeof scoreLead>['breakdown'] | null;

/** Fields that let the form explain what the automation just did. */
function explain(
  analysis: Analysis,
  breakdown: Breakdown,
  tierRule: string,
  rep: Pick<Salesperson, 'name' | 'role_title' | 'territory'>,
  routeRule: string,
  steps: AutomationStep[],
  appointmentAt: string | null,
) {
  return {
    tier_rule: tierRule,
    routing_rule: routeRule,
    assigned_role: rep.role_title,
    territory: rep.territory ?? null,
    breakdown,
    analysis: {
      service_category: analysis.service_category,
      intent: analysis.intent,
      urgency: analysis.urgency,
      estimated_budget_usd: analysis.estimated_budget_usd,
      summary: analysis.summary,
      key_signals: analysis.key_signals,
      risks: analysis.risks,
      recommended_next_step: analysis.recommended_next_step,
    },
    reply: { subject: analysis.suggested_reply_subject, body: analysis.suggested_reply_body },
    appointment_at: appointmentAt,
    steps,
  };
}

function simulate(payload: unknown, scenarioId: 'smb' | 'enterprise', persistedReason: string) {
  const parsed = LeadInput.safeParse(payload);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return NextResponse.json({ ok: false, error: 'Invalid submission', details }, { status: 422 });
  }
  const scenario = SCENARIOS[scenarioId];
  const r = runLeadPipeline(parsed.data, scenario.reps, currentOpenCounts(scenarioId), { persisted: false });
  return NextResponse.json(
    {
      ok: true,
      mode: 'demo',
      persisted: false,
      persisted_reason: persistedReason,
      scenario: scenarioId,
      team: scenario.company,
      lead_id: null,
      tier: r.tier,
      score: r.analysis.score,
      assigned_to: r.rep.name,
      ai_provider: 'mock',
      status: 'success',
      duration_ms: r.durationMs,
      ...explain(r.analysis, r.breakdown, r.tierRule, r.rep, r.routeRule, r.steps, r.appointmentAt),
    },
    { status: 201 },
  );
}

/* ------------------------------------------------------------------ */
/* Handler                                                             */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const t0 = performance.now();
  const startedAt = new Date().toISOString();

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body must be valid JSON' }, { status: 400 });
  }

  // The enterprise demo team only exists in memory, and without a database the demo still runs end to end.
  const scenarioId = parseScenarioId((await cookies()).get(SCENARIO_COOKIE)?.value);
  if (scenarioId === 'enterprise') return simulate(payload, scenarioId, 'Enterprise demo team is simulated.');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return simulate(payload, scenarioId, 'No database is configured.');

  let db: SupabaseClient;
  try {
    db = getAdminClient();
  } catch (err) {
    return NextResponse.json({ ok: false, error: errMsg(err) }, { status: 500 });
  }

  const steps: AutomationStep[] = [];
  const activities: ActivityInsert[] = [];
  let leadId: string | null = null;
  let runId: string | null = null;
  let mode: RunMode = 'demo';
  let provider = 'mock';
  let modelName = 'heuristic-v1';

  const flushActivities = async () => {
    if (!leadId || activities.length === 0) return;
    const rows = activities.map((a) => ({
      lead_id: leadId,
      automation_run_id: runId,
      salesperson_id: a.salesperson_id ?? null,
      activity_type: a.activity_type,
      title: a.title,
      description: a.description ?? null,
      metadata: a.metadata ?? {},
    }));
    const { error } = await db.from('lead_activities').insert(rows);
    if (error) console.error('[northstar] lead_activities insert failed:', error.message);
  };

  try {
    /* 1. Validate ---------------------------------------------------- */
    const input = await runStep(steps, 'validate_payload', 'Validate form submission', async () => {
      const parsed = LeadInput.safeParse(payload);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; '),
        );
      }
      return {
        value: parsed.data,
        detail: `Payload accepted for ${parsed.data.email}`,
        output: { fields: Object.keys(parsed.data) },
      };
    });

    /* 2. Public portfolio submissions always run in Demo Mode -------- */
    mode = await runStep(steps, 'check_demo_mode', 'Check Demo Mode toggle', async () => {
      return {
        value: 'demo' as const,
        detail: 'Public portfolio submissions always use Demo Mode. AI and email providers are never called.',
        output: { mode: 'demo', source: 'server-enforced portfolio demo' },
      };
    });

    /* 3. Persist lead ----------------------------------------------- */
    const lead = await runStep(steps, 'persist_lead', 'Save lead record', async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const dup = await db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .ilike('email', input.email)
        .gte('created_at', since);

      const row = must(
        await db
          .from('leads')
          .insert({
            full_name: input.full_name,
            email: input.email,
            company: input.company ?? null,
            phone: input.phone ?? null,
            service_interest: input.service_interest ?? null,
            budget_range: input.budget_range ?? null,
            timeline: input.timeline ?? null,
            message: input.message,
            source: input.source,
            status: 'new',
            is_demo: mode === 'demo',
          })
          .select('id')
          .single<{ id: string }>(),
        'Insert lead',
      );

      const repeat = (dup.count ?? 0) > 0;
      return {
        value: row,
        status: repeat ? ('warning' as const) : ('success' as const),
        detail: repeat
          ? `Lead ${row.id} created. The same email submitted ${dup.count} time(s) in the last 24 hours.`
          : `Lead ${row.id} created with status "new"`,
        output: { lead_id: row.id, repeat_submissions_24h: dup.count ?? 0 },
      };
    });
    leadId = lead.id;

    /* Create the run row so activities can reference it ------------- */
    const run = must(
      await db
        .from('automation_runs')
        .insert({
          lead_id: leadId,
          trigger: 'webhook',
          mode,
          status: 'running',
          steps,
          started_at: startedAt,
        })
        .select('id')
        .single<{ id: string }>(),
      'Insert automation run',
    );
    runId = run.id;

    activities.push({
      activity_type: 'lead_received',
      title: 'Form submission received',
      description: `${input.full_name}${input.company ? ` (${input.company})` : ''} submitted the contact form.`,
      metadata: { source: input.source, mode },
    });

    /* 4. AI analysis ------------------------------------------------- */
    const analysis = await runStep(steps, 'ai_analysis', 'Analyze lead with AI', async () => {
      const wantsMock = mode === 'demo' || !process.env.OPENAI_API_KEY;
      if (wantsMock) {
        const a = mockAnalysis(input);
        return {
          value: a,
          status: mode === 'demo' ? ('success' as const) : ('warning' as const),
          detail:
            mode === 'demo'
              ? 'Demo Mode: deterministic mock analyzer used, no OpenAI call made.'
              : 'OPENAI_API_KEY is not set. Fell back to the mock analyzer.',
          output: { provider, model: modelName, score: a.score, category: a.service_category },
        };
      }
      try {
        const result = await openAiAnalysis(input);
        provider = 'openai';
        modelName = result.model;
        return {
          value: result.analysis,
          detail: `${result.model} returned a schema-valid analysis (confidence ${result.analysis.confidence.toFixed(2)}).`,
          output: {
            provider,
            model: modelName,
            score: result.analysis.score,
            category: result.analysis.service_category,
          },
        };
      } catch (err) {
        const a = mockAnalysis(input);
        return {
          value: a,
          status: 'warning' as const,
          detail: `OpenAI call failed (${errMsg(err)}). Fell back to the mock analyzer.`,
          output: { provider, model: modelName, score: a.score, category: a.service_category },
        };
      }
    });

    /* 5. Tier rules + save analysis --------------------------------- */
    const { tier, rule: tierRule } = await runStep(steps, 'apply_tier_rules', 'Apply tier rules', async () => {
      const result = classifyTier(analysis);
      const { error } = await db
        .from('leads')
        .update({
          tier: result.tier,
          score: analysis.score,
          ai_analysis: { ...analysis, provider, model: modelName },
          status: 'analyzing',
        })
        .eq('id', leadId);
      if (error) throw new Error(`Save analysis: ${error.message}`);
      return {
        value: result,
        detail: `${result.tier} tier: ${result.rule}`,
        output: {
          tier: result.tier,
          score: analysis.score,
          estimated_budget_usd: analysis.estimated_budget_usd,
          category: analysis.service_category,
        },
      };
    });

    activities.push({
      activity_type: 'ai_analysis',
      title: `Scored ${analysis.score}/100 (${tier} tier)`,
      description: analysis.summary,
      metadata: { provider, model: modelName, rule: tierRule, signals: analysis.key_signals },
    });

    /* 6. Assignment -------------------------------------------------- */
    const assigned = await runStep(steps, 'assign_salesperson', 'Assign salesperson', async () => {
      const reps = must(
        await db
          .from('salespeople')
          .select('id, name, email, role_title, tier_focus, max_open_leads, calendar_url')
          .eq('active', true)
          .returns<Salesperson[]>(),
        'Load salespeople',
      );

      const openRows = must(
        await db
          .from('leads')
          .select('assigned_to')
          .in('status', ['assigned', 'contacted', 'qualified', 'appointment_set'])
          .not('assigned_to', 'is', null)
          .returns<{ assigned_to: string }[]>(),
        'Load open lead counts',
      );
      const openCounts = new Map<string, number>();
      for (const row of openRows) {
        openCounts.set(row.assigned_to, (openCounts.get(row.assigned_to) ?? 0) + 1);
      }

      const choice = chooseSalesperson(tier, reps, openCounts);
      const { error } = await db
        .from('leads')
        .update({
          assigned_to: choice.rep.id,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
        })
        .eq('id', leadId);
      if (error) throw new Error(`Save assignment: ${error.message}`);

      return {
        value: choice,
        detail: choice.rule,
        output: {
          salesperson: choice.rep.name,
          salesperson_id: choice.rep.id,
          open_lead_counts: Object.fromEntries(reps.map((r) => [r.name, openCounts.get(r.id) ?? 0])),
        },
      };
    });
    const rep = assigned.rep;

    activities.push({
      activity_type: 'assigned',
      title: `Assigned to ${rep.name}`,
      description: assigned.rule,
      salesperson_id: rep.id,
      metadata: { tier, salesperson_email: rep.email },
    });

    /* 7. Emails ------------------------------------------------------ */
    await runStep(steps, 'generate_emails', 'Generate and log emails', async () => {
      const liveSend = mode === 'live' && !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
      const from = process.env.EMAIL_FROM ?? 'Northstar Digital <hello@northstardigital.example>';
      const signature = `\n\n${rep.name}\n${rep.role_title}, Northstar Digital${rep.calendar_url ? `\nBook a time: ${rep.calendar_url}` : ''}`;

      const drafts = [
        {
          email_type: 'lead_acknowledgment' as const,
          direction: 'outbound' as const,
          to: input.email,
          subject: analysis.suggested_reply_subject,
          body: `${analysis.suggested_reply_body}${signature}`,
        },
        {
          email_type: 'rep_notification' as const,
          direction: 'internal' as const,
          to: rep.email,
          subject: `New ${tier}-tier lead: ${input.full_name}${input.company ? ` (${input.company})` : ''}`,
          body: [
            `Score: ${analysis.score}/100 (${tier} tier)`,
            `Category: ${analysis.service_category} | Urgency: ${analysis.urgency}`,
            `Budget estimate: $${analysis.estimated_budget_usd.toLocaleString('en-US')}`,
            '',
            analysis.summary,
            '',
            `Next step: ${analysis.recommended_next_step}`,
            `Signals: ${analysis.key_signals.join('; ') || 'none'}`,
            `Risks: ${analysis.risks.join('; ') || 'none'}`,
            '',
            `Contact: ${input.email}${input.phone ? ` | ${input.phone}` : ''}`,
          ].join('\n'),
        },
      ];

      let failures = 0;
      const rows = [];
      for (const d of drafts) {
        let status: 'sent' | 'mocked' | 'failed' = 'mocked';
        let messageId: string | undefined;
        let error: string | null = null;
        if (liveSend) {
          try {
            messageId = await sendViaResend(from, d.to, d.subject, d.body);
            status = 'sent';
          } catch (err) {
            status = 'failed';
            error = errMsg(err);
            failures += 1;
          }
        }
        rows.push({
          lead_id: leadId,
          salesperson_id: rep.id,
          automation_run_id: runId,
          email_type: d.email_type,
          direction: d.direction,
          to_email: d.to,
          from_email: from,
          subject: d.subject,
          body: d.body,
          status,
          provider: liveSend ? 'resend' : 'mock',
          provider_message_id: messageId ?? null,
          is_mock: !liveSend,
          error,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        });
      }

      const { error } = await db.from('email_logs').insert(rows);
      if (error) throw new Error(`Insert email logs: ${error.message}`);

      activities.push({
        activity_type: 'email_logged',
        title: liveSend ? 'Emails sent' : 'Emails drafted (mock)',
        description: `${rows.length} message(s) recorded for ${input.email} and ${rep.email}.`,
        salesperson_id: rep.id,
        metadata: { live: liveSend, failures },
      });

      return {
        value: rows.length,
        status: failures > 0 ? ('warning' as const) : ('success' as const),
        detail: liveSend
          ? `${rows.length - failures} of ${rows.length} emails sent through Resend.`
          : `${rows.length} emails written to email_logs as mock messages. Nothing was sent.`,
        output: { live: liveSend, recipients: drafts.map((d) => d.to) },
      };
    });

    /* 8. Appointment (high tier only) -------------------------------- */
    let appointmentAt: string | null = null;
    await runStep(steps, 'propose_appointment', 'Propose discovery call', async () => {
      if (tier !== 'high') {
        return {
          value: null,
          status: 'skipped' as const,
          detail: `Only high-tier leads get an automatic proposal. This lead is ${tier} tier.`,
        };
      }
      const when = nextBusinessDayAt(17);
      appointmentAt = when.toISOString();
      const appt = must(
        await db
          .from('appointments')
          .insert({
            lead_id: leadId,
            salesperson_id: rep.id,
            scheduled_at: when.toISOString(),
            duration_minutes: 45,
            status: 'proposed',
            meeting_url: rep.calendar_url,
            notes: `Auto-proposed. ${analysis.recommended_next_step}`,
          })
          .select('id')
          .single<{ id: string }>(),
        'Insert appointment',
      );
      activities.push({
        activity_type: 'appointment_proposed',
        title: 'Discovery call proposed',
        description: `45 minutes with ${rep.name} on ${when.toUTCString()}.`,
        salesperson_id: rep.id,
        metadata: { appointment_id: appt.id },
      });
      return {
        value: appt.id,
        detail: `45-minute call proposed with ${rep.name} for ${when.toUTCString()}.`,
        output: { appointment_id: appt.id, scheduled_at: when.toISOString() },
      };
    });

    /* Finalize ------------------------------------------------------- */
    const durationMs = Math.round(performance.now() - t0);
    const finalStatus = steps.some((s) => s.status === 'warning') ? 'partial' : 'success';

    const { error: runError } = await db
      .from('automation_runs')
      .update({
        status: finalStatus,
        ai_provider: provider,
        model: modelName,
        steps,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);
    if (runError) console.error('[northstar] run finalize failed:', runError.message);

    await flushActivities();

    return NextResponse.json(
      {
        ok: true,
        mode,
        lead_id: leadId,
        automation_run_id: runId,
        tier,
        score: analysis.score,
        assigned_to: rep.name,
        ai_provider: provider,
        status: finalStatus,
        duration_ms: durationMs,
        persisted: true,
        scenario: scenarioId,
        team: SCENARIOS[scenarioId].company,
        ...explain(
          analysis,
          provider === 'mock' ? scoreLead(input).breakdown : null,
          tierRule,
          rep,
          assigned.rule,
          steps,
          appointmentAt,
        ),
      },
      { status: 201 },
    );
  } catch (err) {
    const message = errMsg(err);
    const durationMs = Math.round(performance.now() - t0);
    console.error('[northstar] webhook failed:', message);

    if (runId) {
      activities.push({
        activity_type: 'automation_failed',
        title: 'Automation failed',
        description: message,
      });
      const { error } = await db
        .from('automation_runs')
        .update({
          status: 'failed',
          ai_provider: provider,
          model: modelName,
          steps,
          error: message,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
      if (error) console.error('[northstar] run failure update failed:', error.message);
      await flushActivities();
    }

    if (err instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: 'Invalid submission', details: message }, { status: 422 });
    }
    return NextResponse.json(
      { ok: false, error: 'Automation failed', details: message, lead_id: leadId, automation_run_id: runId },
      { status: 500 },
    );
  }
}

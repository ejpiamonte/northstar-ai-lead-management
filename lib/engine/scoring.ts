import type { Analysis, LeadInput, ServiceCategory } from './schema';

/* ------------------------------------------------------------------ */
/* Deterministic mock analyzer (Demo Mode and OpenAI fallback)         */
/* ------------------------------------------------------------------ */

export const firstName = (full: string): string => full.trim().split(/\s+/)[0] ?? full;

export function parseBudgetUsd(range?: string): number {
  if (!range) return 0;
  const nums = [
    ...range
      .toLowerCase()
      .replace(/,/g, '')
      .matchAll(/(\d+(?:\.\d+)?)\s*(k|m)?/g),
  ]
    .map((m) => parseFloat(m[1]) * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1))
    .filter((n) => n > 0);
  if (nums.length === 0) return 0;
  return Math.round(nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0]);
}

const REPLY_TEMPLATES: Record<ServiceCategory, string> = {
  ai_automation:
    'Thanks for the detail on your workflow. Automation projects like this work best when we map the current process first, so I would like to set up a focused discovery call. We will walk through the steps, the systems involved, and where AI can remove manual work safely.',
  web_app:
    'Thanks for sharing the scope. A custom web application is a good fit for what you describe. I would like to learn who will use it day to day and which integrations matter, so a short scoping call is the best next step.',
  website:
    'Thanks for reaching out about your website. We can help with design and build. A quick call will let us confirm goals, content, and timeline, then we will send a clear proposal.',
  support_maintenance:
    'Thanks for flagging this. Our support team can take a look right away. Please reply with the page or screen where the problem appears and any recent changes, and we will confirm a fix and timeline.',
  consulting:
    'Thanks for getting in touch. We would be glad to help you evaluate options. A short call will help us understand where you are today and what a useful outcome looks like.',
  other:
    'Thanks for reaching out. We read your message and would like to learn a little more about what you need so we can point you to the right person.',
};

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  ai_automation: 'AI automation',
  web_app: 'Web application',
  website: 'Website',
  support_maintenance: 'Support and maintenance',
  consulting: 'Consulting',
  other: 'Other',
};

const BASE_FIT: Record<ServiceCategory, number> = {
  ai_automation: 45,
  web_app: 35,
  website: 25,
  consulting: 25,
  support_maintenance: 12,
  other: 15,
};

/** Points that make up a mock score, so the UI can explain it. */
export interface ScoreBreakdown {
  fit: number;
  budget: number;
  urgency: number;
  completeness: number;
}

export function scoreLead(input: LeadInput): { analysis: Analysis; breakdown: ScoreBreakdown } {
  const text = `${input.service_interest ?? ''} ${input.message}`.toLowerCase();
  const budget = parseBudgetUsd(input.budget_range);

  let category: ServiceCategory = 'other';
  if (/automat|workflow|agent|\bai\b|llm|n8n|zapier|rpa|integration/.test(text)) category = 'ai_automation';
  else if (/web app|portal|dashboard|saas|platform|mvp|internal tool/.test(text)) category = 'web_app';
  else if (/support|bug|fix|maintenance|hosting|retainer|broken|not working|plugin/.test(text))
    category = 'support_maintenance';
  else if (/website|landing|redesign|wordpress|shopify/.test(text)) category = 'website';
  else if (/consult|audit|strategy|advice/.test(text)) category = 'consulting';

  const urgency: Analysis['urgency'] = /asap|urgent|immediately|this week|deadline|right away/.test(text)
    ? 'high'
    : /month|quarter|soon|next/.test(`${text} ${input.timeline ?? ''}`.toLowerCase())
      ? 'medium'
      : 'low';

  const intent: Analysis['intent'] =
    category === 'support_maintenance'
      ? 'support_request'
      : budget >= 5000 && urgency !== 'low'
        ? 'ready_to_buy'
        : budget > 0
          ? 'evaluating'
          : 'exploring';

  const breakdown: ScoreBreakdown = {
    fit: BASE_FIT[category],
    budget: budget >= 25000 ? 30 : budget >= 10000 ? 24 : budget >= 5000 ? 16 : budget >= 2000 ? 9 : budget > 0 ? 4 : 0,
    urgency: urgency === 'high' ? 15 : urgency === 'medium' ? 8 : 0,
    completeness: (input.company ? 5 : 0) + (input.phone ? 3 : 0) + (input.message.length > 300 ? 4 : 0),
  };
  const score = Math.max(
    0,
    Math.min(100, breakdown.fit + breakdown.budget + breakdown.urgency + breakdown.completeness),
  );

  const signals: string[] = [];
  if (budget > 0) signals.push(`Stated budget around $${budget.toLocaleString('en-US')}`);
  if (urgency !== 'low') signals.push(`Urgency read as ${urgency}`);
  if (input.company) signals.push(`Company provided: ${input.company}`);
  if (input.phone) signals.push('Phone number provided');
  if (input.timeline) signals.push(`Timeline: ${input.timeline}`);

  const risks: string[] = [];
  if (budget === 0) risks.push('No budget stated');
  if (!input.company) risks.push('No company provided');
  if (input.message.length < 80) risks.push('Short message, scope is unclear');

  return {
    breakdown,
    analysis: {
      service_category: category,
      intent,
      urgency,
      estimated_budget_usd: budget,
      score,
      confidence: 0.62,
      summary: `${input.full_name}${input.company ? ` from ${input.company}` : ''} is asking about ${CATEGORY_LABEL[category].toLowerCase().replace('ai ', 'AI ')}. Intent reads as ${intent.replaceAll('_', ' ')} with ${urgency} urgency.`,
      key_signals: signals,
      risks,
      recommended_next_step:
        category === 'support_maintenance'
          ? 'Triage the issue and reply within one business day.'
          : 'Book a discovery call within two business days.',
      suggested_reply_subject: `Re: your enquiry to Northstar Digital`,
      suggested_reply_body: `Hi ${firstName(input.full_name)},\n\n${REPLY_TEMPLATES[category]}`,
    },
  };
}

export const mockAnalysis = (input: LeadInput): Analysis => scoreLead(input).analysis;

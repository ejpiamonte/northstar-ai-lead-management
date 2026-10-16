import { z } from 'zod';

export const REGIONS = ['North America', 'EMEA', 'APAC'] as const;
export type Region = (typeof REGIONS)[number];

export const LeadInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  service_interest: z.string().trim().max(120).optional(),
  budget_range: z.string().trim().max(80).optional(),
  timeline: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(4000),
  source: z.string().trim().max(60).default('website_form'),
  /** Optional; used for territory routing in the enterprise demo. Not persisted. */
  region: z.enum(REGIONS).optional(),
});
export type LeadInput = z.infer<typeof LeadInput>;

export const SERVICE_CATEGORIES = [
  'ai_automation',
  'web_app',
  'website',
  'support_maintenance',
  'consulting',
  'other',
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export const INTENTS = ['ready_to_buy', 'evaluating', 'exploring', 'support_request'] as const;
export const URGENCIES = ['low', 'medium', 'high'] as const;

export const AnalysisSchema = z.object({
  service_category: z.enum(SERVICE_CATEGORIES),
  intent: z.enum(INTENTS),
  urgency: z.enum(URGENCIES),
  estimated_budget_usd: z.number().transform((n) => Math.max(0, Math.round(n))),
  score: z.number().transform((n) => Math.max(0, Math.min(100, Math.round(n)))),
  confidence: z.number().transform((n) => Math.max(0, Math.min(1, n))),
  summary: z.string().min(1),
  key_signals: z.array(z.string()),
  risks: z.array(z.string()),
  recommended_next_step: z.string().min(1),
  suggested_reply_subject: z.string().min(1),
  suggested_reply_body: z.string().min(1),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/** JSON Schema sent to OpenAI structured outputs (strict mode). */
export const ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'service_category',
    'intent',
    'urgency',
    'estimated_budget_usd',
    'score',
    'confidence',
    'summary',
    'key_signals',
    'risks',
    'recommended_next_step',
    'suggested_reply_subject',
    'suggested_reply_body',
  ],
  properties: {
    service_category: { type: 'string', enum: [...SERVICE_CATEGORIES] },
    intent: { type: 'string', enum: [...INTENTS] },
    urgency: { type: 'string', enum: [...URGENCIES] },
    estimated_budget_usd: { type: 'number' },
    score: { type: 'integer' },
    confidence: { type: 'number' },
    summary: { type: 'string' },
    key_signals: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    recommended_next_step: { type: 'string' },
    suggested_reply_subject: { type: 'string' },
    suggested_reply_body: { type: 'string' },
  },
};

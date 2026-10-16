/** Human duration from milliseconds: "1.2 s", "38 min", "3.5 h", "2.1 d". */
export function duration(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
  const m = s / 60;
  if (m < 90) return `${Math.round(m)} min`;
  const h = m / 60;
  if (h < 36) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

export const minutesLabel = (min: number) =>
  min < 60 ? `${min} min` : min < 48 * 60 ? `${min / 60} h` : `${min / 1440} d`;

export const usdCompact = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

export const pct = (v: number) => `${Math.round(v * 100)}%`;

export const SOURCE_LABEL: Record<string, string> = {
  website_form: 'Website form',
  referral: 'Referral',
  linkedin: 'LinkedIn',
  event: 'Event',
  paid_search: 'Paid search',
  partner: 'Partner',
};

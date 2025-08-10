import { PRItem } from '../../types';

export interface SummaryMetrics {
  count: number;
  merged: number;
  open: number;
  medianLeadTimeH: number | null;
  avgLeadTimeH: number | null;
  medianReviewH: number | null;
  avgReviewH: number | null;
  staleOpen: number;
}

const HOURS_MS = 36e5;

function median(arr: number[]): number | null {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function average(arr: number[]): number | null {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}
function toHours(ms: number | null): number | null {
  return ms == null ? null : Math.round((ms / HOURS_MS) * 10) / 10;
}

export function computeSummaryMetrics(items: PRItem[]): SummaryMetrics | null {
  if (!items || items.length === 0) return null;
  const now = Date.now();
  const merged = items.filter((i) => i.closed_at && i.state !== 'open');
  const leadTimes = merged
    .map((i) =>
      i.first_commit_at && i.closed_at
        ? new Date(i.closed_at).getTime() -
          new Date(i.first_commit_at).getTime()
        : null
    )
    .filter((n): n is number => typeof n === 'number');
  const reviewDurations = items
    .map((i) =>
      i.published_at && i.first_review_at
        ? new Date(i.first_review_at).getTime() -
          new Date(i.published_at).getTime()
        : null
    )
    .filter((n): n is number => typeof n === 'number');

  return {
    count: items.length,
    merged: merged.length,
    open: items.filter((i) => i.state === 'open').length,
    medianLeadTimeH: toHours(median(leadTimes)),
    avgLeadTimeH: toHours(average(leadTimes)),
    medianReviewH: toHours(median(reviewDurations)),
    avgReviewH: toHours(average(reviewDurations)),
    staleOpen: items.filter(
      (i) =>
        i.state === 'open' &&
        now - new Date(i.created_at).getTime() > 7 * 24 * HOURS_MS
    ).length,
  };
}

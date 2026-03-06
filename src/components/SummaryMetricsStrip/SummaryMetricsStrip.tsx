import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { computeSummaryMetrics } from '../../utils/metrics/summary';

function formatHours(h: number) {
  if (h >= 48) return `${(h / 24).toFixed(1)}d`;
  if (h >= 24) return '1d+';
  return `${h}h`;
}

export function SummaryMetricsStrip({
  summary,
  loading,
}: {
  summary: ReturnType<typeof computeSummaryMetrics> | null;
  loading: boolean;
}) {
  type Metric = {
    key: string;
    label: string;
    value: string | number | null;
    icon: React.ReactNode;
  };

  const IconPR = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-default-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3" />
      <path d="M9 6h6a3 3 0 0 1 3 3v8" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9v9" />
    </svg>
  );
  const IconOpen = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-success"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h14" />
      <path d="M10 5l7 7-7 7" />
    </svg>
  );
  const IconMerged = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-default-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 7v10" />
      <path d="M17 7v4a4 4 0 0 1-4 4H7" />
      <circle cx="7" cy="5" r="2" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="17" cy="5" r="2" />
    </svg>
  );
  const IconClock = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-4 h-4 text-default-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );

  const metrics: Metric[] = [
    { key: 'prs', label: 'PRs', value: summary?.count ?? null, icon: IconPR },
    {
      key: 'open',
      label: 'Open',
      value: summary?.open ?? null,
      icon: IconOpen,
    },
    {
      key: 'merged',
      label: 'Merged',
      value: summary?.merged ?? null,
      icon: IconMerged,
    },
    {
      key: 'lead',
      label: 'Median Lead',
      value:
        summary?.medianLeadTimeH != null
          ? formatHours(summary.medianLeadTimeH)
          : null,
      icon: IconClock,
    },
    {
      key: 'review',
      label: 'Median Review',
      value:
        summary?.medianReviewH != null
          ? formatHours(summary.medianReviewH)
          : null,
      icon: IconClock,
    },
  ];

  return (
    <section aria-label="Pull request summary metrics" className="mt-3">
      <div className="flex flex-wrap items-center text-xs md:text-sm gap-x-3 gap-y-1 rounded px-2.5 justify-around">
        {metrics.slice(0, 4).map((m, idx) => (
          <React.Fragment key={m.key}>
            {idx > 0 && (
              <span aria-hidden="true" className="text-default-300 select-none">
                •
              </span>
            )}
            <span
              role="group"
              aria-label={`${m.label}: ${m.value ?? 'Not available'}`}
              className="inline-flex items-center gap-1"
            >
              <span className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true">
                {m.icon}
              </span>
              <span className="text-default-400 uppercase tracking-wide hidden sm:inline text-[10px]">
                {loading ? <Skeleton width="w-8" /> : m.label}
              </span>
              <span
                className="font-semibold tabular-nums text-default-700"
                aria-live="polite"
              >
                {loading ? (
                  <Skeleton width="w-8" />
                ) : m.value != null ? (
                  <>{m.value}</>
                ) : (
                  '—'
                )}
              </span>
            </span>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

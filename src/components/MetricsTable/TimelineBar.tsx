import React from 'react';

interface TimelineBarProps {
  draftMs: number | null;
  reviewMs: number | null;
  activeMs: number | null;
}

export default function TimelineBar({
  draftMs,
  reviewMs,
  activeMs,
}: TimelineBarProps) {
  const a = draftMs ?? 0;
  const b = reviewMs ?? 0;
  const d = activeMs ?? 0;
  const total = a + b + d || 1;
  const pct = (x: number) => (x / total) * 100;
  const fmt = (ms: number | null) =>
    ms == null ? 'N/A' : `${Math.floor(ms / 36e5)}h`;
  const draftLabel = fmt(draftMs);
  const reviewLabel = fmt(reviewMs);
  const activeLabel = fmt(activeMs);
  const infomation = `Draft: ${draftLabel} Review: ${reviewLabel} Active: ${activeLabel}`;

  return (
    <div
      className="flex flex-col items-start w-32"
      aria-label={infomation}
      title={infomation}
    >
      <div className="flex w-full items-center">
        <div
          className="h-2 rounded-full bg-success"
          style={{ width: `${pct(a)}%` }}
        />
        <div
          className="h-2 bg-warning rounded-full"
          style={{ width: `${pct(b)}%` }}
        />
        <div
          className="h-2 rounded-full bg-primary"
          style={{ width: `${pct(d)}%` }}
        />
      </div>
      <div className="text-xs mt-1" aria-hidden="true">
        {infomation}
      </div>
    </div>
  );
}

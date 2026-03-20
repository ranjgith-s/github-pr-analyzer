import React, { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';
import { formatDuration } from '@/lib/utils';

interface TimelineBarProps {
  createdAt: string | null;
  publishedAt?: string | null;
  firstReviewAt?: string | null;
  closedAt?: string | null;
}

const parseDate = (d?: string | null) => (d ? new Date(d).getTime() : null);

export default function TimelineBar({
  createdAt,
  publishedAt,
  firstReviewAt,
  closedAt,
}: TimelineBarProps) {
  // Parse dates once
  const createdMs = useMemo(() => parseDate(createdAt), [createdAt]);
  const publishedMs = useMemo(() => parseDate(publishedAt), [publishedAt]);
  const firstReviewMs = useMemo(
    () => parseDate(firstReviewAt),
    [firstReviewAt]
  );
  const closedMs = useMemo(() => parseDate(closedAt), [closedAt]);

  const draftLabel = formatDuration(createdMs, publishedMs);
  const reviewLabel = formatDuration(publishedMs, firstReviewMs);
  const activeLabel = formatDuration(firstReviewMs, closedMs);
  const totalLabel = formatDuration(createdMs, closedMs);

  // based on the time strings, calculate the percentages

  const totalTime = closedMs && createdMs ? closedMs - createdMs : null;

  const reviewTime =
    firstReviewMs && publishedMs ? firstReviewMs - publishedMs : null;

  const activeTime =
    closedMs && firstReviewMs ? closedMs - firstReviewMs : null;

  const draftTime = publishedMs && createdMs ? publishedMs - createdMs : null;

  const draftPercentage =
    totalTime && draftTime ? (draftTime / totalTime) * 100 : 0;
  const reviewPercentage =
    totalTime && reviewTime ? (reviewTime / totalTime) * 100 : 0;
  const activePercentage =
    totalTime && activeTime ? (activeTime / totalTime) * 100 : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex flex-col items-start w-32 h-4 font-mono"
            tabIndex={0}
          >
            {totalLabel}
            <div className="flex w-full items-center">
              <div
                className="h-1 rounded-full bg-indigo-500"
                style={{ width: `${draftPercentage}%` }}
              />
              <div
                className="h-1 rounded-full bg-lime-400"
                style={{ width: `${reviewPercentage}%` }}
              />
              <div
                className="h-1 rounded-full bg-teal-400"
                style={{ width: `${activePercentage}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="h-1 rounded-full w-2 bg-indigo-500" />
              Draft time {draftLabel}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="h-1 rounded-full w-2 bg-lime-400" />
              Review time {reviewLabel}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <div className="h-1 rounded-full w-2 bg-teal-400" />
              Active time {activeLabel}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

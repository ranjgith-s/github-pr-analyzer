import React from 'react';
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

export default function TimelineBar({
  createdAt,
  publishedAt,
  firstReviewAt,
  closedAt,
}: TimelineBarProps) {
  const draftLabel = formatDuration(createdAt, publishedAt);
  const reviewLabel = formatDuration(publishedAt, firstReviewAt);
  const activeLabel = formatDuration(firstReviewAt, closedAt);

  // based on the time strings, calculate the percentages

  const totalTime =
    closedAt && createdAt
      ? new Date(closedAt).getTime() - new Date(createdAt).getTime()
      : null;

  const reviewTime =
    firstReviewAt && publishedAt
      ? new Date(firstReviewAt).getTime() - new Date(publishedAt).getTime()
      : null;

  const activeTime =
    closedAt && firstReviewAt
      ? new Date(closedAt).getTime() - new Date(firstReviewAt).getTime()
      : null;

  const draftTime =
    publishedAt && createdAt
      ? new Date(publishedAt).getTime() - new Date(createdAt).getTime()
      : null;

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
            {formatDuration(createdAt, closedAt)}
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

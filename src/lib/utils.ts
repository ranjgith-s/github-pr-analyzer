import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return 'N/A';

  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 'N/A';

  const diffMs = endMs - startMs;
  if (diffMs < 0) return 'N/A';

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  const days = Math.floor(diffMs / DAY);
  if (days > 0) {
    const hours = Math.floor((diffMs % DAY) / HOUR);
    return hours ? `${days}d ${hours}h` : `${days}d`;
  }

  const hours = Math.floor(diffMs / HOUR);
  if (hours > 0) return `${hours}h`;

  const minutes = Math.floor((diffMs % HOUR) / MINUTE);
  const seconds = Math.floor((diffMs % MINUTE) / SECOND);

  if (minutes > 0 && seconds > 0) return `${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

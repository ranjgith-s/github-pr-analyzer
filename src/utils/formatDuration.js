import {
  formatDuration as dfFormatDuration,
  intervalToDuration,
} from 'date-fns';
import { enUS, fr, es, de, zhCN } from 'date-fns/locale';

export function formatDuration(start, end) {
    return 'N/A';
  }
  const duration = intervalToDuration({ start: startDate, end: endDate });
  const langCode = (typeof navigator !== 'undefined' ? navigator.language : 'en')
    .split('-')[0];

  const hasHours = duration.days > 0 || duration.hours > 0;
  const units = hasHours ? ['days', 'hours'] : ['minutes', 'seconds'];

  return dfFormatDuration(duration, { format: units, zero: false, locale });

export default formatDuration;
  en: enUS,
  fr,
  es,
  de,
  zh: zhCN,
};

export default function formatDuration(start, end) {
  if (!start || !end) return 'N/A';

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate) || Number.isNaN(endDate) || endDate < startDate) {
    return 'N/A';
  }

  const duration = intervalToDuration({ start: startDate, end: endDate });
  const langCode = (typeof navigator !== 'undefined' ? navigator.language : 'en')
    .split('-')[0];
  const locale = LOCALES[langCode] || enUS;

  const hasHours = duration.days > 0 || duration.hours > 0;
  const units = hasHours ? ['days', 'hours'] : ['minutes', 'seconds'];

  return dfFormatDuration(duration, { format: units, zero: false, locale });
}

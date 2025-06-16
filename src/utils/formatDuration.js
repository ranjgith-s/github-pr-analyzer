import {formatDuration as dfFormatDuration, intervalToDuration} from 'date-fns';
import {enUS, fr, es, de, zhCN} from 'date-fns/locale';

const LOCALES = {
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
  if (isNaN(startDate) || isNaN(endDate) || endDate < startDate) return 'N/A';

  const duration = intervalToDuration({start: startDate, end: endDate});
  const langCode = (navigator.language || 'en').split('-')[0];
  const locale = LOCALES[langCode] || enUS;

  return dfFormatDuration(duration, {format: ['days', 'hours'], zero: false, locale});
}

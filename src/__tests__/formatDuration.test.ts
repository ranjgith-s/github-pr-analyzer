import {formatDuration} from '../MetricsTable';

test('returns N/A when start or end is missing', () => {
  expect(formatDuration(undefined, '2020-01-01')).toBe('N/A');
  expect(formatDuration('2020-01-01', undefined)).toBe('N/A');
});

test('returns N/A when end is before start', () => {
  expect(formatDuration('2020-01-02', '2020-01-01')).toBe('N/A');
});

test('formats durations correctly', () => {
  expect(formatDuration('2020-01-01T00:00:00Z', '2020-01-01T05:00:00Z')).toBe('5h');
  expect(formatDuration('2020-01-01T00:00:00Z', '2020-01-03T01:00:00Z')).toBe('2d 1h');
});

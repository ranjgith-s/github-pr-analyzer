// Utility helpers for MetricsTable presentational components

export const firstKey = (keys: any): string => {
  if (!keys) return '';
  if (typeof keys === 'string') return keys;
  if (Array.isArray(keys)) return keys[0];
  if (keys instanceof Set) return Array.from(keys)[0] as string;
  if (typeof keys === 'object' && 'currentKey' in keys)
    return (keys as any).currentKey;
  return '';
};

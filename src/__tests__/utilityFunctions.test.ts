import { describe, it, expect } from '@jest/globals';

// Utility functions from github.ts (copy for isolated test)
function median(arr: number[]) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function average(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

describe('utility functions', () => {
  describe('median', () => {
    it('returns 0 for empty array', () => {
      expect(median([])).toBe(0);
    });
    it('returns the middle value for odd length', () => {
      expect(median([1, 3, 2])).toBe(2);
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });
    it('returns the average of two middle values for even length', () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
      expect(median([4, 1, 2, 3])).toBe(2.5);
    });
    it('handles negative numbers', () => {
      expect(median([-2, -1, 0, 1, 2])).toBe(0);
    });
  });

  describe('average', () => {
    it('returns 0 for empty array', () => {
      expect(average([])).toBe(0);
    });
    it('returns the average for non-empty array', () => {
      expect(average([1, 2, 3])).toBe(2);
      expect(average([2, 4, 6, 8])).toBe(5);
    });
    it('handles negative numbers', () => {
      expect(average([-2, 2])).toBe(0);
    });
  });

  describe('round', () => {
    it('rounds to two decimal places', () => {
      expect(round(1.234)).toBe(1.23);
      expect(round(1.235)).toBe(1.24);
      expect(round(1.2)).toBe(1.2);
    });
    it('handles negative numbers', () => {
      expect(round(-1.236)).toBe(-1.24);
    });
  });
});

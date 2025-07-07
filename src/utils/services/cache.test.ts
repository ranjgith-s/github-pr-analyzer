import { InMemoryCache } from './cache';

describe('InMemoryCache', () => {
  it('sets and gets values', () => {
    const cache = new InMemoryCache<number>();
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('returns undefined for missing keys', () => {
    const cache = new InMemoryCache<string>();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('overwrites values for the same key', () => {
    const cache = new InMemoryCache<number>();
    cache.set('a', 1);
    cache.set('a', 2);
    expect(cache.get('a')).toBe(2);
  });

  it('clears values', () => {
    const cache = new InMemoryCache<number>();
    cache.set('a', 1);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.entries()).toEqual([]);
  });

  it('checks existence', () => {
    const cache = new InMemoryCache<number>();
    cache.set('a', 1);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
  });

  it('returns all entries', () => {
    const cache = new InMemoryCache<number>();
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.entries()).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });
});

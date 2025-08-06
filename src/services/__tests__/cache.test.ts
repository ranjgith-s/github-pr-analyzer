import { getFromCache, setCache, clearCache } from '../cache';

describe('Enhanced Cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should store and retrieve data', async () => {
    const data = { test: 'value' };
    await setCache('test-key', data, 60);

    const retrieved = await getFromCache('test-key');
    expect(retrieved).toEqual(data);
  });

  it('should return null for non-existent keys', async () => {
    const retrieved = await getFromCache('non-existent');
    expect(retrieved).toBeNull();
  });

  it('should expire data after TTL', async () => {
    await setCache('test-key', { test: 'value' }, 0.1); // 100ms

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 200));

    const retrieved = await getFromCache('test-key');
    expect(retrieved).toBeNull();
  });

  it('should implement LRU eviction when cache is full', async () => {
    // Fill cache beyond max size
    for (let i = 0; i < 105; i++) {
      await setCache(`key-${i}`, { value: i }, 60);
    }

    // First key should be evicted
    const firstKey = await getFromCache('key-0');
    expect(firstKey).toBeNull();

    // Last key should still exist
    const lastKey = await getFromCache('key-104');
    expect(lastKey).toEqual({ value: 104 });
  });

  it('should clear all cache entries', async () => {
    await setCache('key1', { value: 1 }, 60);
    await setCache('key2', { value: 2 }, 60);

    clearCache();

    expect(await getFromCache('key1')).toBeNull();
    expect(await getFromCache('key2')).toBeNull();
  });
});

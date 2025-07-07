// cache.ts
// Simple in-memory cache for session-scoped data

export class InMemoryCache<T = unknown> {
  private cache = new Map<string, T>();

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  entries(): [string, T][] {
    return Array.from(this.cache.entries());
  }
}

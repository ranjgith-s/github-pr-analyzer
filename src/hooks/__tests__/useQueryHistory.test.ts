import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { useQueryHistory } from '../useQueryHistory';

describe('useQueryHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads empty history and bookmarks by default', () => {
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toEqual([]);
    expect(result.current.bookmarks).toEqual([]);
  });

  it('loads existing history and bookmarks from localStorage with Date conversion', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const rawHistory = [
      { id: '1', query: 'q1', timestamp: now.toISOString(), resultCount: 5 },
    ];
    const rawBookmarks = [
      { id: 'b1', query: 'bq1', timestamp: now.toISOString(), title: 'Title' },
    ];
    localStorage.setItem(
      'github-pr-analyzer-query-history',
      JSON.stringify(rawHistory)
    );
    localStorage.setItem(
      'github-pr-analyzer-query-bookmarks',
      JSON.stringify(rawBookmarks)
    );

    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history[0].timestamp).toBeInstanceOf(Date);
    expect(result.current.bookmarks[0].timestamp).toBeInstanceOf(Date);
    expect(result.current.history[0].resultCount).toBe(5);
    expect(result.current.bookmarks[0].title).toBe('Title');
  });

  it('adds to history (deduplicates and limits to 50)', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      for (let i = 0; i < 55; i++) {
        result.current.addToHistory(`query-${i}`);
      }
      // Add duplicate
      result.current.addToHistory('query-54');
    });
    expect(result.current.history.length).toBe(50);
    // Most recent first
    expect(result.current.history[0].query).toBe('query-54');
    // Duplicate removed (should not appear twice)
    const dupCount = result.current.history.filter(
      (h) => h.query === 'query-54'
    ).length;
    expect(dupCount).toBe(1);
  });

  it('persists history to localStorage', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('test');
    });

    const stored = JSON.parse(
      localStorage.getItem('github-pr-analyzer-query-history') || '[]'
    );
    expect(stored[0].query).toBe('test');
  });

  it('adds and removes bookmarks (no duplicates)', async () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addBookmark('foo', 'Title');
      result.current.addBookmark('foo', 'Title'); // duplicate ignored
    });
    await waitFor(() => expect(result.current.bookmarks.length).toBe(1));
    const idToRemove = result.current.bookmarks[0].id;
    act(() => {
      result.current.removeBookmark(idToRemove);
    });
    expect(result.current.bookmarks.length).toBe(0);
  });

  it('keeps existing bookmark when trying to add duplicate', async () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addBookmark('foo', 'Title1');
    });
    await waitFor(() => expect(result.current.bookmarks.length).toBe(1));
    const firstId = result.current.bookmarks[0].id;
    act(() => {
      result.current.addBookmark('foo', 'Title2'); // ignored duplicate
    });
    expect(result.current.bookmarks.length).toBe(1);
    expect(result.current.bookmarks[0].id).toBe(firstId);
    expect(result.current.bookmarks[0].title).toBe('Title1');
  });

  it('clears history', () => {
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('foo');
      result.current.clearHistory();
    });
    expect(result.current.history).toEqual([]);
  });

  it('handles localStorage parse errors gracefully', () => {
    localStorage.setItem('github-pr-analyzer-query-history', '{bad json');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useQueryHistory());
    expect(result.current.history).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('handles localStorage set errors gracefully', () => {
    const setItemSpy = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useQueryHistory());
    act(() => {
      result.current.addToHistory('foo');
      result.current.addBookmark('bar');
    });
    expect(warnSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

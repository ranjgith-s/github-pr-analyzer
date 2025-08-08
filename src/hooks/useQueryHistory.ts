import { useState, useEffect } from 'react';

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultCount?: number;
  title?: string;
}

export interface UseQueryHistoryReturn {
  history: QueryHistoryItem[];
  bookmarks: QueryHistoryItem[];
  addToHistory: (query: string, resultCount?: number) => void;
  addBookmark: (query: string, title?: string) => void;
  removeBookmark: (id: string) => void;
  clearHistory: () => void;
}

const STORAGE_KEYS = {
  HISTORY: 'github-pr-analyzer-query-history',
  BOOKMARKS: 'github-pr-analyzer-query-bookmarks',
};

export function useQueryHistory(): UseQueryHistoryReturn {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<QueryHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        setHistory(
          parsed.map((item: QueryHistoryItem) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      }

      const storedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (storedBookmarks) {
        const parsed = JSON.parse(storedBookmarks);
        setBookmarks(
          parsed.map((item: QueryHistoryItem) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      }
    } catch (error) {
      console.warn('Failed to load query history:', error);
    }
  }, []);

  // Save to localStorage when history changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.HISTORY,
        JSON.stringify(history.slice(0, 50))
      ); // Keep last 50
    } catch (error) {
      console.warn('Failed to save query history:', error);
    }
  }, [history]);

  // Save to localStorage when bookmarks change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (error) {
      console.warn('Failed to save query bookmarks:', error);
    }
  }, [bookmarks]);

  const addToHistory = (query: string, resultCount?: number) => {
    const newItem: QueryHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      resultCount,
    };

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.query !== query);
      return [newItem, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const addBookmark = (query: string, title?: string) => {
    const newBookmark: QueryHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: new Date(),
      title,
    };

    setBookmarks((prev) => {
      // Check if already bookmarked
      if (prev.some((item) => item.query === query)) {
        return prev;
      }
      return [newBookmark, ...prev];
    });
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    bookmarks,
    addToHistory,
    addBookmark,
    removeBookmark,
    clearHistory,
  };
}

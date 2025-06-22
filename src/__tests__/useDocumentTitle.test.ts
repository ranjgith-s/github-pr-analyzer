import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

describe('useDocumentTitle', () => {
  it('sets and restores document.title', () => {
    const prev = document.title;
    const { unmount } = renderHook(() => useDocumentTitle('Test Title'));
    expect(document.title).toBe('Test Title');
    unmount();
    expect(document.title).toBe(prev);
  });

  it('does nothing if no title is provided', () => {
    const prev = document.title;
    renderHook(() => useDocumentTitle());
    expect(document.title).toBe(prev);
  });
});

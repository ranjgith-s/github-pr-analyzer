import { renderHook } from '@testing-library/react';
import { useMetaDescription } from '../hooks/useMetaDescription';

describe('useMetaDescription', () => {
  let meta: HTMLMetaElement;
  beforeEach(() => {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  });
  afterEach(() => {
    if (meta.isConnected) {
      document.head.removeChild(meta);
    }
  });

  it('sets and restores meta description', () => {
    meta.setAttribute('content', 'old');
    const { unmount } = renderHook(() => useMetaDescription('new desc'));
    expect(meta.getAttribute('content')).toBe('new desc');
    unmount();
    expect(meta.getAttribute('content')).toBe('old');
  });

  it('does nothing if no description is provided', () => {
    meta.setAttribute('content', 'old');
    renderHook(() => useMetaDescription());
    expect(meta.getAttribute('content')).toBe('old');
  });

  it('does nothing if meta tag is missing', () => {
    document.head.removeChild(meta);
    expect(() => renderHook(() => useMetaDescription('desc'))).not.toThrow();
  });
});

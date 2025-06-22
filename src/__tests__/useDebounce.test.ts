import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns debounced value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'a' } }
    );
    expect(result.current).toBe('a');
    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('b');
  });

  it('clears timeout on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'a' } }
    );
    rerender({ value: 'b' });
    unmount();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    // No error should occur
  });
});

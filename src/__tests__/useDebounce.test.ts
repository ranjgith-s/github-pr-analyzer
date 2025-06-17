import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

jest.useFakeTimers();

test('returns debounced value', () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 200),
    { initialProps: { value: 'first' } }
  );

  expect(result.current).toBe('first');
  rerender({ value: 'second' });
  expect(result.current).toBe('first');

  act(() => {
    jest.advanceTimersByTime(200);
  });

  expect(result.current).toBe('second');
});

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useQueryEditor } from '../useQueryEditor';

const createWrapper = () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(MemoryRouter, null, children);
  };
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

// Mock the queryValidator module
jest.mock('../../services/queryValidator', () => ({
  validateQuery: jest.fn((query: string) => ({
    isValid: !query.includes('invalid'),
    sanitized: query,
    errors: query.includes('invalid') ? ['Invalid query'] : [],
    warnings: [],
  })),
}));

describe('useQueryEditor', () => {
  it('should initialize with provided query', () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.query).toBe('is:pr author:john');
    expect(result.current.editValue).toBe('is:pr author:john');
    expect(result.current.isEditing).toBe(false);
  });

  it('should handle editing state transitions', () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    // Start editing
    act(() => {
      result.current.startEditing();
    });

    expect(result.current.isEditing).toBe(true);

    // Cancel editing
    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.isEditing).toBe(false);
  });

  it('should validate queries during editing', async () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('invalid"query');
    });

    // Wait for debounced validation
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.canSave).toBe(false);
  });

  it('should handle query changes correctly', () => {
    const onQueryChange = jest.fn();
    const { result } = renderHook(
      () =>
        useQueryEditor({
          initialQuery: 'is:pr author:john',
          onQueryChange,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('is:pr author:jane');
    });

    expect(result.current.editValue).toBe('is:pr author:jane');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.hasChanges).toBe(true);
  });

  it('should save valid queries', () => {
    const onQueryChange = jest.fn();
    const { result } = renderHook(
      () =>
        useQueryEditor({
          initialQuery: 'is:pr author:john',
          onQueryChange,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('is:pr author:jane');
    });

    act(() => {
      result.current.saveQuery();
    });

    expect(onQueryChange).toHaveBeenCalledWith('is:pr author:jane');
    expect(result.current.isEditing).toBe(false);
    expect(result.current.query).toBe('is:pr author:jane');
  });

  it('should not save invalid queries', () => {
    const onQueryChange = jest.fn();
    const { result } = renderHook(
      () =>
        useQueryEditor({
          initialQuery: 'is:pr author:john',
          onQueryChange,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('invalid"query');
    });

    act(() => {
      result.current.saveQuery();
    });

    expect(onQueryChange).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(true);
  });

  it('should reset edit value when cancelling', () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('is:pr author:jane');
    });

    expect(result.current.editValue).toBe('is:pr author:jane');

    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.editValue).toBe('is:pr author:john');
    expect(result.current.isEditing).toBe(false);
  });

  it('should update when initial query changes', () => {
    const { result, rerender } = renderHook(
      ({ initialQuery }) => useQueryEditor({ initialQuery }),
      {
        wrapper: createWrapper(),
        initialProps: { initialQuery: 'is:pr author:john' },
      }
    );

    expect(result.current.query).toBe('is:pr author:john');

    rerender({ initialQuery: 'is:pr author:jane' });

    expect(result.current.query).toBe('is:pr author:jane');
    expect(result.current.editValue).toBe('is:pr author:jane');
  });

  it('should not update edit value during editing when initial query changes', () => {
    const { result, rerender } = renderHook(
      ({ initialQuery }) => useQueryEditor({ initialQuery }),
      {
        wrapper: createWrapper(),
        initialProps: { initialQuery: 'is:pr author:john' },
      }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('is:pr author:modified');
    });

    rerender({ initialQuery: 'is:pr author:jane' });

    // Edit value should not change during editing
    expect(result.current.editValue).toBe('is:pr author:modified');
    expect(result.current.isEditing).toBe(true);
  });

  it('should handle custom debounce timing', async () => {
    const { result } = renderHook(
      () =>
        useQueryEditor({
          initialQuery: 'is:pr author:john',
          debounceMs: 100,
        }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('invalid"query');
    });

    // Should validate faster with shorter debounce
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.isValid).toBe(false);
  });
});

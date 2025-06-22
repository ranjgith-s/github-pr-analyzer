import { useEffect } from 'react';

export function useMetaDescription(description?: string | null) {
  useEffect(() => {
    if (!description) return;
    const element = document.querySelector('meta[name="description"]');
    if (!element) return;
    const prev = element.getAttribute('content');
    element.setAttribute('content', description);
    return () => {
      if (prev) {
        element.setAttribute('content', prev);
      }
    };
  }, [description]);
}

import '@testing-library/jest-dom';

// Primer components rely on CSS.supports which is not implemented in jsdom
if (typeof (window as any).CSS === 'undefined') {
  (window as any).CSS = { supports: () => false };
} else if (typeof (window as any).CSS.supports !== 'function') {
  (window as any).CSS.supports = () => false;
}

if (typeof (window as any).ResizeObserver === 'undefined') {
  (window as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

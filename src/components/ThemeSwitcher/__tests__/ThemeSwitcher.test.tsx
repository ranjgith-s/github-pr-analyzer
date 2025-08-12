import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock lucide-react icons to avoid ESM transform issues and keep render minimal
jest.mock('lucide-react', () => ({
  Moon: (props: any) =>
    React.createElement('svg', { 'data-icon': 'moon', ...props }),
  Sun: (props: any) =>
    React.createElement('svg', { 'data-icon': 'sun', ...props }),
}));

// Utility to reset DOM classes and storage between tests
const STORAGE_KEY = 'vite-ui-theme';

const resetDom = () => {
  document.documentElement.classList.remove('dark');
  localStorage.removeItem(STORAGE_KEY);
};

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    resetDom();
  });

  afterEach(() => {
    resetDom();
    jest.restoreAllMocks();
  });

  it('initializes from localStorage: dark -> has dark class and light-mode aria label', async () => {
    localStorage.setItem(STORAGE_KEY, 'dark');

    const ThemeSwitcher = (await import('../ThemeSwitcher')).default;
    render(<ThemeSwitcher />);

    // dark mode active -> button offers switching to light
    const btn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(btn).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initializes from localStorage: light -> no dark class and dark-mode aria label', async () => {
    localStorage.setItem(STORAGE_KEY, 'light');

    const ThemeSwitcher = (await import('../ThemeSwitcher')).default;
    render(<ThemeSwitcher />);

    const btn = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(btn).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initializes from system preference when no storage (prefers dark)', async () => {
    // Mock matchMedia to report prefers-color-scheme: dark
    const originalMatch = window.matchMedia;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (q: string) => ({
      matches: q.includes('prefers-color-scheme: dark'),
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    const ThemeSwitcher = (await import('../ThemeSwitcher')).default;
    render(<ThemeSwitcher />);

    const btn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(btn).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // restore
    window.matchMedia = originalMatch;
  });

  it('initializes from system preference when no storage (prefers light)', async () => {
    const originalMatch = window.matchMedia;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (q: string) => ({
      matches: false, // light mode preferred
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    const ThemeSwitcher = (await import('../ThemeSwitcher')).default;
    render(<ThemeSwitcher />);

    const btn = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(btn).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    window.matchMedia = originalMatch;
  });

  it('getInitialIsDark returns false when window is undefined (SSR)', async () => {
    const originalWindow = global.window;
    // simulate SSR
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;
    const { getInitialIsDark } = await import('../ThemeSwitcher');
    expect(getInitialIsDark()).toBe(false);
    // restore
    (global as any).window = originalWindow;
  });

  it('getInitialIsDark reads from localStorage when window is defined', async () => {
    // ensure window exists and matchMedia returns false
    const originalMatch = window.matchMedia;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = () => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });

    const { getInitialIsDark } = await import('../ThemeSwitcher');
    localStorage.setItem(STORAGE_KEY, 'dark');
    expect(getInitialIsDark()).toBe(true);
    localStorage.setItem(STORAGE_KEY, 'light');
    expect(getInitialIsDark()).toBe(false);

    window.matchMedia = originalMatch;
  });

  it('setTheme applies dark and light classes and persists to storage', async () => {
    const { setTheme } = await import('../ThemeSwitcher');
    setTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

    setTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('getInitialIsDark branches are covered via isolated module loads', () => {
    const originalWindow = global.window;
    const originalMatch = window.matchMedia;

    // Case 1: SSR (no window)
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (global as any).window;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('../ThemeSwitcher');
      expect(mod.getInitialIsDark()).toBe(false);
    });

    // Case 2: window defined, no storage, system prefers dark
    jest.isolateModules(() => {
      // restore window and force prefers dark
      (global as any).window = originalWindow;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).matchMedia = () => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
      localStorage.removeItem(STORAGE_KEY);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('../ThemeSwitcher');
      expect(mod.getInitialIsDark()).toBe(true);
    });

    // Restore
    window.matchMedia = originalMatch;
    (global as any).window = originalWindow;
  });

  it('toggles theme, updates localStorage, and DOM class', async () => {
    // start from light
    localStorage.setItem(STORAGE_KEY, 'light');
    const ThemeSwitcher = (await import('../ThemeSwitcher')).default;
    render(<ThemeSwitcher />);

    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: /switch to dark mode/i });

    // toggle to dark
    await user.click(btn);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    // aria label flips
    expect(
      screen.getByRole('button', { name: /switch to light mode/i })
    ).toBeInTheDocument();

    // toggle back to light
    await user.click(
      screen.getByRole('button', { name: /switch to light mode/i })
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(
      screen.getByRole('button', { name: /switch to dark mode/i })
    ).toBeInTheDocument();
  });

  // SSR path is covered in lines but not executed here to avoid invalid hook call from mixed React instances.
});

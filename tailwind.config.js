// tailwind.config.js
import { heroui } from '@heroui/theme';
import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
    './node_modules/@heroui/theme/dist/components/**/*.js', // include all heroui components
    './src/components/ui-bridge/**/*.{ts,tsx}',
    './src/components/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base palette for shadcn tokens (simplified static values)
        background: '#ffffff',
        foreground: '#111827',
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#2563eb',
        primary: { DEFAULT: '#006fee', foreground: '#ffffff' },
        secondary: { DEFAULT: '#e4e4e7', foreground: '#111827' },
        destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
        accent: { DEFAULT: '#f4f4f5', foreground: '#111827' },
        muted: { DEFAULT: '#f4f4f5', foreground: '#6b7280' },
        card: { DEFAULT: '#ffffff', foreground: '#111827' },
        warning: { DEFAULT: '#f59e0b', foreground: '#000000' },
        success: { DEFAULT: '#10b981', foreground: '#ffffff' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  darkMode: 'class',
  plugins: [heroui(), animate],
};

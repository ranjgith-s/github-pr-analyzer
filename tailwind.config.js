// tailwind.config.js
import { heroui } from '@heroui/theme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
    './node_modules/@heroui/theme/dist/components/**/*.js', // include all heroui components
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui()],
};

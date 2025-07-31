/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Notion-inspired color palette
        'notion-gray': {
          100: 'var(--color-notion-gray-100)',
          200: 'var(--color-notion-gray-200)',
          300: 'var(--color-notion-gray-300)',
          400: 'var(--color-notion-gray-400)',
          500: 'var(--color-notion-gray-500)',
          600: 'var(--color-notion-gray-600)',
          700: 'var(--color-notion-gray-700)',
          800: 'var(--color-notion-gray-800)',
          900: 'var(--color-notion-gray-900)',
        },
        'notion-brown': {
          DEFAULT: 'var(--color-notion-brown)',
          light: 'var(--color-notion-brown-light)',
        },
        'notion-orange': {
          DEFAULT: 'var(--color-notion-orange)',
          light: 'var(--color-notion-orange-light)',
        },
        'notion-yellow': {
          DEFAULT: 'var(--color-notion-yellow)',
          light: 'var(--color-notion-yellow-light)',
        },
        'notion-green': {
          DEFAULT: 'var(--color-notion-green)',
          light: 'var(--color-notion-green-light)',
        },
        'notion-blue': {
          DEFAULT: 'var(--color-notion-blue)',
          light: 'var(--color-notion-blue-light)',
        },
        'notion-purple': {
          DEFAULT: 'var(--color-notion-purple)',
          light: 'var(--color-notion-purple-light)',
        },
        'notion-pink': {
          DEFAULT: 'var(--color-notion-pink)',
          light: 'var(--color-notion-pink-light)',
        },
        'notion-red': {
          DEFAULT: 'var(--color-notion-red)',
          light: 'var(--color-notion-red-light)',
        },
        // Semantic colors
        'success': {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
        },
        'warning': {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        'info': {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
        },
        // Surface colors
        'background': 'var(--color-background)',
        'surface': 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-hover': 'var(--color-surface-hover)',
        'border': 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
      },
      fontFamily: {
        'notion': 'var(--font-family-notion)',
      },
      boxShadow: {
        'notion': 'var(--color-shadow)',
        'notion-light': 'var(--color-shadow-light)',
        'notion-medium': 'var(--color-shadow-medium)',
      },
    },
  },
  plugins: [],
}
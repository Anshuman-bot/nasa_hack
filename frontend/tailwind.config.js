/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#000000', // true black
          900: '#03050a', // deep space black
          850: '#070b14', // sleek card surface
          800: '#0d1322', // elevated elements
          750: '#131b2e',
          700: '#1b253d', // subtle borders
        },
        electric: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // electric cobalt
          700: '#1d4ed8',
          glow: 'rgba(37, 99, 235, 0.35)',
        },
        acid: {
          300: '#d9f99d',
          400: '#a3e635', // acid lime
          500: '#84cc16',
          glow: 'rgba(163, 230, 53, 0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'electric-glow': '0 0 25px -4px rgba(37, 99, 235, 0.45)',
        'acid-glow': '0 0 15px -2px rgba(163, 230, 53, 0.5)',
        'subtle-card': '0 8px 30px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}

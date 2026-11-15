/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          DEFAULT: '#FFE500',
          300: '#FFF066',
          400: '#FFE500',
          500: '#E6CF00',
          600: '#CCA300',
          glow: 'rgba(255, 229, 0, 0.45)',
        },
        royal: {
          DEFAULT: '#1749D8',
          400: '#3D6FF5',
          500: '#2558E8',
          600: '#1749D8',
          700: '#113BB8',
          800: '#0C2B8E',
          900: '#071D64',
          950: '#04103A',
          glow: 'rgba(23, 73, 216, 0.45)',
        },
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
          600: '#1749D8', // mapped to Royal Blue
          700: '#113BB8',
          glow: 'rgba(23, 73, 216, 0.35)',
        },
        acid: {
          300: '#FFF066',
          400: '#FFE500', // mapped to Bright Yellow
          500: '#E6CF00',
          glow: 'rgba(255, 229, 0, 0.4)',
        },
      },
      fontFamily: {
        anton: ['Anton', 'Impact', 'sans-serif'],
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

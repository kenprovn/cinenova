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
        background: '#0B0D14',
        surface: {
          DEFAULT: '#151924',
          light: '#1E2333',
          border: '#272E40',
        },
        primary: {
          DEFAULT: '#B91C32',
          hover: '#D12640',
          dark: '#8B1425',
          glow: 'rgba(185, 28, 50, 0.35)',
        },
        gold: {
          DEFAULT: '#E5B96B',
          hover: '#F3CD85',
          glow: 'rgba(229, 185, 107, 0.3)',
        },
        cinetext: {
          primary: '#F8FAFC',
          secondary: '#9CA3AF',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px rgba(185, 28, 50, 0.45)',
        'glow-gold': '0 0 20px rgba(229, 185, 107, 0.35)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

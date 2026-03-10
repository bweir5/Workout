/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        sans: ['DM Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        bg: '#050507',
        card: '#0a0a0c',
        border: '#131316',
        chest: 'hsl(4, 75%, 52%)',
        back: 'hsl(210, 75%, 52%)',
        legs: 'hsl(142, 55%, 40%)',
        arms: 'hsl(32, 90%, 52%)',
        shoulders: 'hsl(270, 60%, 58%)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pr-flash': 'prFlash 1s ease-out forwards',
        'spring-in': 'springIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      },
      keyframes: {
        prFlash: {
          '0%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.7)' },
          '70%': { boxShadow: '0 0 0 20px rgba(251, 191, 36, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)' }
        },
        springIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
}

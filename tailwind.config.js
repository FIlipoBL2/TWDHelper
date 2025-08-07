/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./ChatLog.tsx",
    "./GameSetup.tsx",
    "./*.tsx"
  ],
  theme: {
    extend: {
      colors: {
        'twd': {
          'dark': '#1a1a1a',
          'darker': '#0d0d0d',
          'gray': '#2d2d2d',
          'red': '#dc2626',
          'blood': '#991b1b',
          'danger': '#ef4444',
          'success': '#22c55e',
          'warning': '#f59e0b',
          'info': '#3b82f6'
        }
      },
      fontFamily: {
        'twd': ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      boxShadow: {
        'twd': '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        'twd-lg': '0 20px 40px -10px rgba(0, 0, 0, 0.6)'
      }
    },
  },
  plugins: [],
}

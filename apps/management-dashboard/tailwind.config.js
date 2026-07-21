/** @type {import('tailwindcss').Config} */
import sharedConfig from "@cbl/ui/tailwind.config.js";

export default {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
      colors: {
        ...sharedConfig.theme?.extend?.colors,
        'lu-brand-red': '#C8102E',
        'lu-primary': '#8C1D2B',
        'lu-secondary': '#D9A441',
        'lu-tertiary': '#C46A2F',
        'lu-bg': '#FAF6EF',
        'lu-text': '#2B1B17',
        'lu-text-muted': '#6E5A4E',
        'lu-success': '#3E7D44',
        'lu-warning': '#D9A441',
        'lu-danger': '#8C1D2B',
      },
      fontFamily: {
        ...sharedConfig.theme?.extend?.fontFamily,
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'fade-in-up-delay-1': 'fade-in-up 0.5s ease-out 0.1s forwards',
        'fade-in-up-delay-2': 'fade-in-up 0.5s ease-out 0.2s forwards',
        'fade-in-up-delay-3': 'fade-in-up 0.5s ease-out 0.3s forwards',
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}

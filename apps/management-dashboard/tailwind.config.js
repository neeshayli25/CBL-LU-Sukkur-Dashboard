/** @type {import('tailwindcss').Config} */
import sharedConfig from "@cbl/ui/tailwind.config.js";

export default {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
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
      }
    }
  }
}

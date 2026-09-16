/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Layered dark surfaces, darkest at the back.
        ink: {
          950: '#07080b',
          900: '#0b0c10',
          800: '#12141b',
          700: '#191c25',
          600: '#232735',
          500: '#2f3446',
        },
        // The single accent: warm gold, used for XP, levels and primary buttons.
        gold: {
          300: '#ffd98a',
          400: '#f5b84a',
          500: '#e09b1f',
          600: '#b57912',
        },
        // Semantic colours for training categories.
        legs: '#e0553f',
        push: '#f08a3c',
        pull: '#3fa7e0',
        core: '#9b6cf0',
        cardio: '#3fd0a4',
        mobility: '#8fd13f',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}

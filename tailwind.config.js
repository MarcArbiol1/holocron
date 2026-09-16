/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aether design tokens (converted from the design repo's oklch values).
        night: '#080a0c',
        panel: '#181c1f',
        ice: '#eff5f6',
        dim: '#7d888c',
        glow: '#5cdcce',
        soft: '#66b79c',
        sand: '#d9b480',
        // Legacy surfaces still used by a few components while the restyle lands.
        ink: { 950: '#07080b', 900: '#0b0c10', 800: '#12141b', 700: '#191c25', 600: '#232735', 500: '#2f3446' },
        gold: { 300: '#ffd98a', 400: '#f5b84a', 500: '#e09b1f', 600: '#b57912' },
        legs: '#e0553f', push: '#f08a3c', pull: '#3fa7e0', core: '#9b6cf0', cardio: '#3fd0a4', mobility: '#8fd13f',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'SFMono-Regular', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        spring: 'linear(0, 0.0772, 0.2473, 0.4431, 0.6252, 0.7746, 0.8857, 0.9608, 1.0063, 1.0296, 1.0379, 1.037, 1.0314, 1.024, 1.0167, 1.0105, 1.0057, 1.0024, 1.0003, 0.9991, 0.9986, 0.9985, 0.9987, 0.999, 0.9993, 0.9995, 0.9997, 0.9999, 1, 1, 1, 1.0001, 1)',
        apple: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}

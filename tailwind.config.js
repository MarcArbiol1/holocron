/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aether design tokens (converted from the design repo's oklch values).
        // iOS dark semantic colours (HIG Color; values from UIKit's dark palette).
        night: '#000000',     // systemBackground
        panel: '#1c1c1e',     // secondarySystemGroupedBackground: cards and grouped lists
        raised: '#2c2c2e',    // tertiary: fields, elevated sheets, row highlight
        ice: '#ffffff',       // label
        dim: '#8e8e93',       // secondaryLabel on black (rgba(235,235,245,.6) flattened; systemGray)
        glow: '#5cdcce',      // the app's tint (Holocron teal); one accent used consistently
        soft: '#30d158',      // systemGreen (good / on target)
        sand: '#d9b480',
        // Legacy surfaces still used by a few components while the restyle lands.
        ink: { 950: '#07080b', 900: '#0b0c10', 800: '#12141b', 700: '#191c25', 600: '#232735', 500: '#2f3446' },
        gold: { 300: '#ffd98a', 400: '#f5b84a', 500: '#e09b1f', 600: '#b57912' },
        legs: '#ff4245',      // systemRed (iOS 26 dark): destructive push: '#f08a3c', pull: '#3fa7e0', core: '#9b6cf0', cardio: '#3fd0a4', mobility: '#8fd13f',
      },
      // SF Pro through the system font stack; numbers use SF with tabular figures (see .font-mono in index.css).
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Helvetica Neue"', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Helvetica Neue"', 'sans-serif'],
        mono: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', '"Helvetica Neue"', 'sans-serif'],
      },
      // Apple's iOS type ramp at the default (Large) size: [size, { lineHeight, letterSpacing }] (HIG Typography).
      // The Tailwind names are mapped onto it so existing classes land on the nearest iOS style.
      fontSize: {
        caption2: ['11px', { lineHeight: '13px', letterSpacing: '0.06px' }],
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0px' }],          // Caption 1
        footnote: ['13px', { lineHeight: '18px', letterSpacing: '-0.08px' }],
        sm: ['15px', { lineHeight: '20px', letterSpacing: '-0.23px' }],      // Subhead
        callout: ['16px', { lineHeight: '21px', letterSpacing: '-0.31px' }],
        base: ['17px', { lineHeight: '22px', letterSpacing: '-0.43px' }],    // Body / Headline
        lg: ['20px', { lineHeight: '25px', letterSpacing: '-0.45px' }],      // Title 3
        xl: ['22px', { lineHeight: '28px', letterSpacing: '-0.26px' }],      // Title 2
        '2xl': ['28px', { lineHeight: '34px', letterSpacing: '0.38px' }],    // Title 1
        '3xl': ['34px', { lineHeight: '41px', letterSpacing: '0.40px' }],    // Large Title
        '5xl': ['48px', { lineHeight: '1', letterSpacing: '0px' }],
      },
      transitionTimingFunction: {
        spring: 'linear(0, 0.0772, 0.2473, 0.4431, 0.6252, 0.7746, 0.8857, 0.9608, 1.0063, 1.0296, 1.0379, 1.037, 1.0314, 1.024, 1.0167, 1.0105, 1.0057, 1.0024, 1.0003, 0.9991, 0.9986, 0.9985, 0.9987, 0.999, 0.9993, 0.9995, 0.9997, 0.9999, 1, 1, 1, 1.0001, 1)',
        apple: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
}

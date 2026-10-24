/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './app.js',
    './store-bridge.js',
    './privacy.html',
    './terms.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface': '#faf8f5',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f4f2ed',
        'surface-container': '#efece6',
        'surface-container-high': '#e8e4dc',
        'surface-container-highest': '#e0dbd1',
        'on-surface': '#18212e',
        'on-surface-variant': '#484f5c',
        'outline': '#59606d',
        'outline-variant': '#c4c6ce',
        'primary': '#031a38',
        'on-primary': '#ffffff',
        'primary-container': '#1b2f4e',
        'on-primary-container': '#b4c7ee',
        'secondary': '#775928',
        'on-secondary': '#ffffff',
        'secondary-container': '#ffd79b',
        'on-secondary-container': '#5d4213',
        'secondary-fixed': '#ffdeae',
        'on-secondary-fixed': '#281800',
        'tertiary': '#0d1a30',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#9aa8c4',
        'error': '#ba1a1a'
      },
      fontFamily: {
        'headline-lg': ['Playfair Display', 'Georgia', 'serif'],
        'headline-md': ['Playfair Display', 'Georgia', 'serif'],
        'headline-sm': ['Playfair Display', 'Georgia', 'serif'],
        'serif': ['Playfair Display', 'Georgia', 'serif'],
        'title-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
        'spec-numeral': ['Inter', 'sans-serif'],
        headline: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace']
      }
    }
  },
  plugins: []
};

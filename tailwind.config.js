/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#05060a', 900: '#0a0c14', 800: '#10131f', 700: '#181c2c', 600: '#242a40' },
        ego: { DEFAULT: '#e5233b', dark: '#8f1424', light: '#ff5a6e' },
        lock: { DEFAULT: '#1f6bff', dark: '#103a99', light: '#6ea0ff' },
        paper: '#f2efe6',
      },
      fontFamily: {
        impact: ['Impact', '"Arial Black"', '"Helvetica Neue"', 'sans-serif'],
        body: ['"Noto Sans JP"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

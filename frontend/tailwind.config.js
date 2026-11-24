/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FBF8F1', dark: '#F3EEE2' },
        forest: {
          50: '#EEF5EF',
          100: '#D9EADD',
          200: '#B3D3BB',
          500: '#3C7A53',
          600: '#2F6A45',
          700: '#285F3C',
          800: '#1F4A2F',
          900: '#16351F',
        },
        ink: '#1B2B22',
        muted: '#5B6B62',
        line: '#DDE1D6',
        saffron: '#D98324',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

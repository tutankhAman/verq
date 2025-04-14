/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Chakra Petch"', 'sans-serif'],
        'heading': ['"Zen Dots"', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'chakra': ['"Chakra Petch"', 'sans-serif'],
        'bruno': ['"Bruno Ace SC"', 'sans-serif'],
        'zen': ['"Zen Dots"', 'sans-serif'],
      },
      fontWeight: {
        'thin': '300',
        'light': '400',
        'normal': '500',
        'medium': '600',
        'semibold': '700',
        'bold': '900',
      },
      colors: {
        'background': '#09090B',
        'heading': '#E9EAEA',
        'paragraph': '#A1A1AA',
      },
    },
  },
  plugins: [],
} 
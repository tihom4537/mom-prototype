/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f7f0ee',
          100: '#efe0dc',
          200: '#dfc2b9',
          source: '#6a3e31',
        },
        secondary: {
          50:  '#ffe8e5',
          300: '#ff7266',
          source: '#ff7468',
          600: '#cc1000',
        },
        success: {
          source: '#3c9718',
        },
        neutral: {
          source: '#212121',
          400: '#c6c6c6',
          600: '#727272',
        },
      },
    },
  },
  plugins: [],
}

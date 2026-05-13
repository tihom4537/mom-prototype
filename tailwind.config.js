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
      keyframes: {
        micPulse: {
          '0%':   { transform: 'scale(1)',   opacity: '0.5' },
          '70%':  { transform: 'scale(2.2)', opacity: '0'   },
          '100%': { transform: 'scale(2.2)', opacity: '0'   },
        },
        conicSpin: {
          '0%':   { transform: 'rotate(0deg)'   },
          '100%': { transform: 'rotate(360deg)' },
        },
        pillPulse: {
          '0%':   { transform: 'scale(1)',    opacity: '0.7' },
          '100%': { transform: 'scale(1.45)', opacity: '0'   },
        },
      },
      animation: {
        micPulse: 'micPulse 1.8s ease-out infinite',
        conicSpin: 'conicSpin 2s linear infinite',
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
          50:  '#F3F3F3',
          200: '#C6C6C6',
          300: '#B0B0B0',
          400: '#989898',
          500: '#868686',
          600: '#727272',
          700: '#5E5E5E',
          800: '#484848',
          900: '#393939',
        },
        danger: {
          50:  '#FFEEEA',
          100: '#FFCDC0',
          200: '#FFAC9A',
          300: '#FF8B78',
          400: '#FF6C5A',
          500: '#EC5042',
          600: '#D4362E',
          700: '#972120',
          800: '#961416',
          900: '#741818',
        },
        success: {
          50:  '#EDF7E6',
          100: '#E3F2D9',
          200: '#C6E5B5',
          300: '#98CF80',
          400: '#698349',
          500: '#309314',
          600: '#187400',
          700: '#005A00',
          800: '#024500',
          900: '#044400',
        },
        warning: {
          50:  '#FEF1E7',
          100: '#F9D7B9',
          200: '#F0BD8F',
          300: '#E2A468',
          400: '#D08D47',
          500: '#BB7728',
          600: '#A46212',
          700: '#985000',
          800: '#713F00',
          900: '#573000',
        },
      },
    },
  },
  plugins: [],
}

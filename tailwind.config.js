/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF8EE',
          100: '#FFF3E0',
          200: '#FFE0B2',
          300: '#FFCC80',
          400: '#FFB74D',
          500: '#FFA01A',
          600: '#FF8F00',
          700: '#CC7000',
          800: '#995400',
          900: '#663800',
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#FFF8EC',
        terracotta: {
          DEFAULT: '#C4572E',
          dark: '#A34320',
          light: '#E5734A',
        },
        saffron: {
          DEFAULT: '#F2A93B',
          dark: '#D98F22',
          light: '#F8C36F',
        },
        deepOlive: {
          DEFAULT: '#3F4A2B',
          dark: '#2A331B',
          light: '#5B6940',
        },
        sage: {
          DEFAULT: '#DDE5C8',
          dark: '#BCC7A3',
          light: '#F0F4E6',
        },
        danger: {
          DEFAULT: '#B3261E',
          dark: '#8C1D18',
        },
        borderMuted: '#E8DCC9',
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['Atkinson Hyperlegible', 'sans-serif'],
      },
      borderRadius: {
        '20': '20px',
        '30': '30px',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(196, 87, 46, 0.08)',
        card: '0 4px 20px rgba(63, 74, 43, 0.06)',
        highlight: '0 0 0 4px rgba(242, 169, 59, 0.4)',
      },
      minHeight: {
        touch: '52px',
      },
      minWidth: {
        touch: '52px',
      },
    },
  },
  plugins: [],
};

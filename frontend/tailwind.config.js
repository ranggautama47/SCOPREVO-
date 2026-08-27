/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      DEFAULT: '0px',
      none: '0px',
      full: '9999px',
    },
    extend: {
      colors: {
        sage: '#C9CBA3',
        lavender: '#DCCCFF',
        yellowAccent: '#FFE1A8',
        tealAccent: '#006D77',
        canvasBg: '#FAFAF9',
        nearBlack: '#1A1A1A',
        dangerRed: '#E63946',
        successGreen: '#2A9D8F',
      },
      fontFamily: {
        editorial: ['Baskervville', 'serif'],
        body: ['Noto Serif', 'serif'],
        ui: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serifBody: ['Noto Serif', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #1A1A1A',
        'brutal-hover': '6px 6px 0px 0px #1A1A1A',
        'brutal-active': '2px 2px 0px 0px #1A1A1A',
      },
    },
  },
  plugins: [],
}

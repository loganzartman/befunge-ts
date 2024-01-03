/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Monaspace Neon', 'ui-monospace'],
        'mono-serif': ['Monaspace Xenon', 'ui-monospace'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f4e4bc",
        ink: "#1c1917",
        gold: "#d97706",
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        serif: ['Merriweather', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

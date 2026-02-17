/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',           // ← ОБЯЗАТЕЛЬНО! Было 'media' → теперь 'class'
  theme: {
    extend: {
      // При желании можно добавить свои цвета, шрифты и т.д.
    },
  },
  plugins: [],
}
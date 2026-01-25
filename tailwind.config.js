/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#2E7D32',
        'warning-orange': '#EF6C00',
        'danger-red': '#C62828',
        'text-high': '#121212',
      }
    },
  },
  plugins: [],
}

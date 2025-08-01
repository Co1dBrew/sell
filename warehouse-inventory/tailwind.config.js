/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1976D2",
        secondary: "#6c757d",
        background: "#FFFFFF",
        card: "#F5F5F5",
        success: "#4caf50",
        warning: "#ff9800",
        error: "#f44336",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

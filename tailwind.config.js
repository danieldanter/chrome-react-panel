/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./panel.html"],
  theme: {
    extend: {
      colors: {
        "brand-blue": "#0ea5e9",
        "brand-blue-dark": "#0284c7",
      },
      borderRadius: {
        xs: "4px",
        s: "6px",
        m: "8px",
        l: "10px",
        xl: "12px",
        "2xl": "14px",
      },
    },
  },
  plugins: [],
};

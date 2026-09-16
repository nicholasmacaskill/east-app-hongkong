/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        east: {
          light: 'rgb(var(--brand-primary-rgb, 40 209 96) / <alpha-value>)',
          dark: 'rgb(var(--brand-primary-dark-rgb, 20 107 49) / <alpha-value>)',
          black: 'rgb(var(--brand-black-rgb, 18 18 18) / <alpha-value>)',
          card: 'rgb(var(--brand-card-rgb, 30 30 30) / <alpha-value>)',
        },
        brand: {
          primary: 'rgb(var(--brand-primary-rgb, 40 209 96) / <alpha-value>)',
          dark: 'rgb(var(--brand-primary-dark-rgb, 20 107 49) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent-rgb, 40 209 96) / <alpha-value>)',
          black: 'rgb(var(--brand-black-rgb, 18 18 18) / <alpha-value>)',
          card: 'rgb(var(--brand-card-rgb, 30 30 30) / <alpha-value>)',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        opensans: ['Open Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
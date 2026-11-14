/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#8B1A1A',
          'primary-dark': '#5A1010',
          'primary-light': '#B83232',
          amber: '#E8A33D',
          'amber-light': '#F3C073',
          cream: '#F5EFE0',
          'cream-surface': '#FAF7F2',
        },
        surface: {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          subtle: '#F3EFE6',
          'dark-bg': '#141110',
          'dark-card': '#1F1A18',
        }
      },
      borderRadius: {
        'card': '20px',
        'sheet': '24px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        hover: '0 10px 25px -5px rgba(139, 26, 26, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        sheet: '0 -10px 30px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: ['Manrope', 'Onest', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

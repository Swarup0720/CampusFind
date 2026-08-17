/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Swissborg 5-Color System
        bg: {
          DEFAULT: '#191E29', // 60%
          dark: '#11141C',
          light: '#222837',
        },
        surface: {
          DEFAULT: '#132D46', // 20%
          light: '#1A3B5C',
          dark: '#0C1E30',
          border: 'rgba(105, 110, 121, 0.28)',
        },
        accent: {
          DEFAULT: '#01C38D', // 10%
          hover: '#00AB7B',
          glow: 'rgba(1, 195, 141, 0.35)',
          muted: 'rgba(1, 195, 141, 0.15)',
        },
        fintech: {
          secondary: '#696E79', // 5%
          primary: '#FFFFFF',   // 5%
          border: 'rgba(105, 110, 121, 0.3)',
        }
      },
      fontFamily: {
        sans: ['"TT Commons Regular"', '"TT Commons"', '"Plus Jakarta Sans"', 'Outfit', 'sans-serif'],
        tt: ['"TT Commons Regular"', '"TT Commons"', '"Plus Jakarta Sans"', 'sans-serif'],
        'tt-demibold': ['"TT Commons Demibold"', '"TT Commons"', 'Outfit', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'input': '12px',
      },
      boxShadow: {
        'fintech': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'fintech-hover': '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px -2px rgba(1, 195, 141, 0.25)',
        'emerald-glow': '0 0 25px rgba(1, 195, 141, 0.4)',
      }
    },
  },
  plugins: [],
}

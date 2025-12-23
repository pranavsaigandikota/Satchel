/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leather: {
            DEFAULT: '#8B4513',
            dark: '#5D2E0C',
            light: '#A0522D',
        },
        parchment: {
            DEFAULT: '#F0EAD6',
            dark: '#E3D4B0',
        },
        ink: '#2F2F2F',
        gold: {
            DEFAULT: '#DAA520',
            glow: '#FFD700',
        },
        rpg: {
            red: '#A63A3A',
        }
      },
      fontFamily: {
        heading: ['Rye', 'serif'],
        subheading: ['Cinzel Decorative', 'cursive'],
        body: ['Patrick Hand', 'cursive'],
        stats: ['Crimson Text', 'serif'],
      },
      backgroundImage: {
        'map-pattern': "url('https://www.transparenttextures.com/patterns/aged-paper.png')", // Fallback/Subtle noise
      }
    },
  },
  plugins: [],
}

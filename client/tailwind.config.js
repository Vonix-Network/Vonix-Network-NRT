/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme background colors
        'dark': {
          50: '#2a3441',
          100: '#242d38',
          200: '#1e2630',
          300: '#1a2129',
          400: '#151b22',
          500: '#0f151b',
          600: '#0c1116',
          700: '#090d11',
          800: '#06080b',
          900: '#030406',
        },
        // Green accent colors (Minecraft theme)
        'gaming-green': {
          50: '#e6fff7',
          100: '#ccffef',
          200: '#99ffdf',
          300: '#66ffcf',
          400: '#33ffbf',
          500: '#00d97e', // Primary green
          600: '#00b368',
          700: '#008c52',
          800: '#00663c',
          900: '#004026',
        },
        // Custom colors from the design
        'minecraft': {
          green: '#00d97e',
          'dark-bg': '#1a2129',
          'card-bg': '#242d38',
          'border': '#2a3441',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0, 217, 126, 0.3)',
        'glow-green-lg': '0 0 30px rgba(0, 217, 126, 0.5)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          'from': { opacity: '0', transform: 'translateX(-20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Navy (Primary) - QuickBooks-inspired
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#2C5F7F', // Main brand color
          600: '#1A3A52', // Darker for headers
          700: '#153047',
          800: '#0f2638',
          900: '#0a1d2b',
        },
        // Sage Green (Success/Profit) - Professional accounting green
        success: {
          50: '#f0f7f4',
          100: '#d4e9de',
          200: '#a9d3be',
          300: '#7dbd9d',
          400: '#52a77d',
          500: '#2D7A5C', // Main success color
          600: '#1f5940',
          700: '#194732',
          800: '#123524',
          900: '#0c2318',
        },
        // Warm Red (Loss/Danger) - Not too bright, professional
        danger: {
          50: '#fef3f2',
          100: '#fee4e2',
          200: '#fecdca',
          300: '#fca5a0',
          400: '#f97168',
          500: '#C44536', // Main danger color
          600: '#991b1b',
          700: '#7f1d1d',
          800: '#651919',
          900: '#511616',
        },
        // Warm Gray (Backgrounds)
        warmGray: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // Financial data colors
        profit: {
          light: '#D4E9DE',
          DEFAULT: '#2D7A5C',
          dark: '#1f5940',
        },
        loss: {
          light: '#FEE4E2',
          DEFAULT: '#C44536',
          dark: '#991b1b',
        },
        neutral: {
          light: '#f5f5f4',
          DEFAULT: '#78716c',
          dark: '#44403c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

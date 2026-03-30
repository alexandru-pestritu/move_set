/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
        card: '#1C1C1E',
        'card-foreground': '#FFFFFF',
        popover: '#1C1C1E',
        'popover-foreground': '#FFFFFF',
        primary: '#0A84FF',
        'primary-foreground': '#FFFFFF',
        secondary: '#2C2C2E',
        'secondary-foreground': '#FFFFFF',
        muted: '#2C2C2E',
        'muted-foreground': '#8E8E93',
        accent: '#2C2C2E',
        'accent-foreground': '#FFFFFF',
        destructive: '#FF453A',
        'destructive-foreground': '#FFFFFF',
        border: '#2C2C2E',
        input: '#2C2C2E',
        ring: '#0A84FF',
        success: '#30D158',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

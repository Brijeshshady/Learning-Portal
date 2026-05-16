/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#a855f7',
        accent: '#10b981',
        background: '#09090b',
        surface: '#121214',
        'surface-bright': '#18181b',
        'outline-variant': '#27272a',
        'on-surface': '#fafafa',
        'on-surface-variant': '#a1a1aa',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        'text-muted': '#71717a',
      },
      fontFamily: {
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

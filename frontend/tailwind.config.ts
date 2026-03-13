import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0D0F14',
        'bg-secondary': '#151820',
        'bg-card': '#1C2030',
        'bg-hover': '#242840',
        'accent-green': '#00D97E',
        'accent-amber': '#F5A623',
        'accent-red': '#FF4D4D',
        'text-primary': '#F0F2F5',
        'text-secondary': '#8892A4',
        'text-muted': '#4A5468',
        'border-custom': '#2A2F42',
        'border-accent': 'rgba(0, 217, 126, 0.2)',
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body: ['Satoshi', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

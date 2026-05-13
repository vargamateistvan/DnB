/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dnb: {
          bg: '#0a0a0f',
          surface: '#13131a',
          card: '#1a1a24',
          border: '#2a2a3a',
          accent: '#ff6b35',
          accent2: '#7c3aed',
          beat: '#ff6b35',
          active: '#22d3ee',
          muted: '#4a4a6a',
          text: '#e2e8f0',
          dim: '#94a3b8',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

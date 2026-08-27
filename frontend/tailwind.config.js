/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0f',
        panel: '#14141c',
        panel2: '#1c1c28',
        edge: '#2a2a3a',
        muted: '#8b8b9e',
        yes: '#22c55e',
        no: '#ef4444',
        accent: '#7c5cff',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

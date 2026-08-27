/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // map design tokens (CSS vars in index.css) to Tailwind
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      bg: 'var(--bg)',
      raised: 'var(--bg-raised)',
      inset: 'var(--bg-inset)',
      line: 'var(--line)',
      linebright: 'var(--line-bright)',
      text: 'var(--text)',
      dim: 'var(--text-dim)',
      faint: 'var(--text-faint)',
      yes: 'var(--yes)',
      no: 'var(--no)',
      amber: 'var(--amber)',
      amberdim: 'var(--amber-dim)',
      white: '#ffffff',
      black: '#000000',
    },
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderColor: { DEFAULT: 'var(--line)' },
      borderRadius: { DEFAULT: '6px' },
    },
  },
  plugins: [],
}

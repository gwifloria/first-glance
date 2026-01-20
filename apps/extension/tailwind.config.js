/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        border: 'var(--border)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        'priority-high': 'var(--priority-high)',
        'priority-medium': 'var(--priority-medium)',
        'priority-low': 'var(--priority-low)',
        'pomodoro-work': 'var(--pomodoro-work)',
        'pomodoro-break': 'var(--pomodoro-break)',
      },
      borderRadius: {
        sm: 'var(--radius-small)',
        md: 'var(--radius-medium)',
        lg: 'var(--radius-large)',
      },
      fontFamily: {
        primary: 'var(--font-primary)',
        secondary: 'var(--font-secondary)',
      },
    },
  },
  plugins: [],
}

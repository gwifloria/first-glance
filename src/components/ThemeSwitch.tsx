import { useTheme } from '@/contexts/ThemeContext'

export function ThemeSwitch() {
  const { themeType, toggleTheme, theme } = useTheme()

  return (
    <button
      className="flex items-center gap-1.5 py-2 px-3.5 border border-[var(--border)] rounded-2xl bg-[var(--bg-card)] text-[var(--text-primary)] cursor-pointer transition-all duration-300 text-[13px] hover:bg-[var(--accent-light)] hover:border-[var(--accent)] hover:-translate-y-px hover:shadow-[var(--shadow-small)]"
      onClick={toggleTheme}
      title={`切换到${themeType === 'journal' ? '科技' : '手帐'}主题`}
    >
      <span className="text-base">{themeType === 'journal' ? '🌸' : '⚡'}</span>
      <span className="font-medium">{theme.name}</span>
    </button>
  )
}

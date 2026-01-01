import { ArrowRightOutlined, CheckOutlined } from '@ant-design/icons'

interface LoginButtonProps {
  loading: boolean
  onLogin: () => void
}

export function LoginButton({ loading, onLogin }: LoginButtonProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)] bg-dotted">
      <div className="bg-white rounded-2xl py-12 px-16 shadow-[0_4px_24px_rgba(0,0,0,0.08)] text-center max-w-[400px]">
        {/* 图标 */}
        <div className="text-5xl mb-6">📓</div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          First Glance
        </h1>

        {/* 副标题 */}
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
          One glance at what matters most
        </p>

        {/* 登录按钮 */}
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full py-4 px-6 bg-[#2c2c2c] text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '登录中...' : '登录滴答清单'}
          {!loading && <ArrowRightOutlined />}
        </button>

        {/* 底部标识 */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-[var(--text-secondary)] tracking-wider">
          <CheckOutlined className="text-green-500" />
          <span>SYNCED & SECURE</span>
        </div>
      </div>
    </div>
  )
}

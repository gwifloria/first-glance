import { Button, Typography, Space } from 'antd'
import { LoginOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface LoginButtonProps {
  loading: boolean
  onLogin: () => void
}

export function LoginButton({ loading, onLogin }: LoginButtonProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#fdf8f3] via-[#fce8e8] to-[#f5ede4] relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute text-[60px] max-sm:text-[40px] opacity-30 animate-float top-[10%] left-[10%]">
        🌸
      </div>
      <div className="absolute text-[60px] max-sm:text-[40px] opacity-30 animate-float top-[20%] right-[15%] [animation-delay:1s]">
        🍃
      </div>
      <div className="absolute text-[60px] max-sm:text-[40px] opacity-30 animate-float bottom-[20%] left-[20%] [animation-delay:2s]">
        ✨
      </div>
      <div className="absolute text-[60px] max-sm:text-[40px] opacity-30 animate-float bottom-[15%] right-[10%] [animation-delay:3s]">
        🌷
      </div>

      <div className="bg-white/90 backdrop-blur-[10px] rounded-[32px] max-sm:rounded-3xl py-[60px] px-[80px] max-sm:py-10 max-sm:px-[30px] max-sm:mx-5 shadow-[0_20px_60px_rgba(232,160,160,0.2),0_0_0_1px_rgba(232,160,160,0.1)] relative z-[1]">
        <Space direction="vertical" align="center" size="large">
          <div className="text-[64px] max-sm:text-[48px] mb-2 animate-bounce">
            📔
          </div>
          <Title
            level={2}
            className="!text-[#5d4e4e] !font-serif !font-semibold !m-0 tracking-[2px]"
          >
            我的待办手帐
          </Title>
          <Text className="!text-[#9b8b8b] text-[15px]">
            连接滴答清单，开始记录美好的一天
          </Text>
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            loading={loading}
            onClick={onLogin}
            className="!h-[52px] !px-10 !text-base !font-medium !rounded-[26px] !bg-gradient-to-br !from-[#e8a0a0] !to-[#f5d6a8] !border-none !shadow-[0_8px_24px_rgba(232,160,160,0.4)] hover:!-translate-y-[3px] hover:!shadow-[0_12px_32px_rgba(232,160,160,0.5)] !transition-all !duration-300"
          >
            登录滴答清单
          </Button>
          <Text className="!text-[#9b8b8b] text-xs mt-2">
            🔐 安全登录，数据同步
          </Text>
        </Space>
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Button } from 'antd'
import { StopOutlined, HomeOutlined } from '@ant-design/icons'

export function BlockedPage() {
  const { t } = useTranslation('blocked')

  const handleGoHome = () => {
    // 移除 blocked 参数，返回正常的新标签页
    window.location.href = chrome.runtime.getURL('src/newtab/index.html')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] p-8">
      <div className="text-center max-w-md">
        <StopOutlined
          className="text-6xl text-[var(--accent)] mb-6"
          style={{ opacity: 0.8 }}
        />
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
          {t('title')}
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">{t('description')}</p>
        <Button
          type="primary"
          size="large"
          icon={<HomeOutlined />}
          onClick={handleGoHome}
        >
          {t('backToHome')}
        </Button>
      </div>
    </div>
  )
}

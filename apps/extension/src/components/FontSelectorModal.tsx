import { useEffect } from 'react'
import { Modal, Segmented } from 'antd'
import { CheckCircleFilled, CrownFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useFont } from '@/hooks/useFont'
import { usePremium } from '@/hooks/usePremium'
import {
  FONT_OPTIONS,
  FONT_SCALES,
  isFontLocked,
  type FontOption,
  type FontScale,
  type FontType,
} from '@/constants/fonts'
import { preloadAllFonts } from '@/services/fontLoader'
import { PremiumBadge } from './common/PremiumBadge'
import { SectionLabel } from './common/SectionLabel'

interface FontSelectorModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 字体选择器主面板：每张卡片用对应字体渲染完整中英文示例
 */
export function FontSelectorModal({ open, onClose }: FontSelectorModalProps) {
  const { fontType, setFontType, fontScale, setFontScale } = useFont()
  const { isPremium } = usePremium()
  const { t } = useTranslation('premium')

  // 打开时预加载所有字体 CDN，让卡片预览能即时呈现
  useEffect(() => {
    if (open) preloadAllFonts()
  }, [open])

  const handleSelect = (type: FontType) => {
    setFontType(type) // provider 自己处理 lock → 弹 PremiumModal；不自动关弹窗，让用户预览后手动关闭作为确认
  }

  return (
    <Modal
      title={t('fontModalTitle')}
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 560 }}
    >
      <p className="text-xs mt-1 mb-4 text-[var(--text-secondary)]">
        {t('fontModalSubtitle')}
      </p>

      <SectionLabel
        className="mb-4"
        right={
          <Segmented
            size="small"
            value={fontScale}
            onChange={(value) => setFontScale(value as FontScale)}
            options={FONT_SCALES.map((scale) => ({
              label: t(`fontSize.${scale}`),
              value: scale,
            }))}
          />
        }
      >
        {t('fontSizeLabel')}
      </SectionLabel>

      <SectionLabel
        className="mb-3 pt-3 border-t border-[var(--border)]"
        right={<PremiumBadge variant="label" size={11} />}
      >
        {t('fontLabel')}
      </SectionLabel>

      <div className="flex flex-col gap-3">
        {FONT_OPTIONS.map((option) => (
          <FontPreviewCard
            key={option.type}
            option={option}
            isActive={fontType === option.type}
            isLocked={isFontLocked(option, isPremium)}
            onClick={() => handleSelect(option.type)}
          />
        ))}
      </div>
    </Modal>
  )
}

function FontPreviewCard({
  option,
  isActive,
  isLocked,
  onClick,
}: {
  option: FontOption
  isActive: boolean
  isLocked: boolean
  onClick: () => void
}) {
  const heading = option.fontFamily?.heading
  const primary = option.fontFamily?.primary
  const hand = option.fontFamily?.hand
  const scale = option.previewScale ?? 1

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ boxShadow: 'var(--shadow-small)' }}
      className={`
        relative w-full p-4 rounded-lg border text-left cursor-pointer transition-all
        text-[var(--text-primary)]
        ${
          isActive
            ? 'ring-2 ring-[var(--accent)] border-[var(--accent)] bg-[var(--bg-secondary)]'
            : 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--text-secondary)]'
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{option.name}</span>
        <span className="flex items-center gap-1">
          {isLocked && (
            <CrownFilled
              style={{ color: 'var(--color-premium-gold)', fontSize: 14 }}
            />
          )}
          {isActive && (
            <CheckCircleFilled
              style={{ color: 'var(--accent)', fontSize: 16 }}
            />
          )}
        </span>
      </div>

      <div
        className="mb-2 leading-tight"
        style={{ fontFamily: heading, fontSize: `${1.875 * scale}rem` }}
      >
        Good morning.
      </div>

      <div
        className="mb-2 leading-none tracking-wide"
        style={{ fontFamily: heading, fontSize: `${1.5 * scale}rem` }}
      >
        09:30 · 2026.05.27
      </div>

      <div
        className="text-sm mb-1 text-[var(--text-secondary)]"
        style={{ fontFamily: primary }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>

      <div
        className="text-sm mb-2 text-[var(--text-secondary)]"
        style={{ fontFamily: primary }}
      >
        早安，今天也要好好生活。
      </div>

      <div
        className="text-base opacity-80 text-[var(--text-secondary)]"
        style={{ fontFamily: hand }}
      >
        "Make today count."
      </div>
    </button>
  )
}

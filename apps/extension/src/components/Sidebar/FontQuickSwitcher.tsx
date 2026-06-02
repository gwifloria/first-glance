import { useEffect, useState } from 'react'
import { Button, Popover, Segmented } from 'antd'
import { CheckOutlined, CrownFilled, FontSizeOutlined } from '@ant-design/icons'
import { POPOVER_CONTENT_STYLE } from '@/constants/styles'
import { useTranslation } from 'react-i18next'
import { useFont } from '@/hooks/useFont'
import { usePremium } from '@/hooks/usePremium'
import {
  FONT_OPTIONS,
  FONT_SCALES,
  isFontLocked,
  type FontScale,
  type FontType,
} from '@/constants/fonts'
import { preloadAllFonts } from '@/services/fontLoader'
import { PremiumBadge } from '../common/PremiumBadge'
import { SectionLabel } from '../common/SectionLabel'

/**
 * Sidebar 上的字体快速切换器
 * Aa 图标点击 → Popover 4 个选项，每行用对应字体渲染名字
 * 付费选项点击未付费时弹 PremiumModal
 */
export function FontQuickSwitcher() {
  const { fontType, setFontType, fontScale, setFontScale } = useFont()
  const { isPremium } = usePremium()
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('premium')

  // 打开时预加载所有字体 CDN，让 Popover 选项能以对应字体呈现
  useEffect(() => {
    if (open) preloadAllFonts()
  }, [open])

  const handleSelect = (type: FontType) => {
    setOpen(false)
    setFontType(type) // provider 自己处理 lock → 弹 PremiumModal
  }

  const content = (
    <div className="flex flex-col py-1 min-w-[200px]">
      <SectionLabel
        className="px-3 py-2 border-b border-[var(--border)]"
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
        className="px-3 pt-2 pb-1"
        right={<PremiumBadge variant="label" />}
      >
        {t('fontLabel')}
      </SectionLabel>
      {FONT_OPTIONS.map((option) => {
        const isActive = fontType === option.type
        const isLocked = isFontLocked(option, isPremium)
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => handleSelect(option.type)}
            className="w-full flex items-center justify-between px-3 py-2 cursor-pointer border-0 bg-transparent text-left hover:bg-[var(--bg-secondary)]"
          >
            <span
              className="text-sm text-[var(--text-primary)]"
              style={{ fontFamily: option.fontFamily?.heading }}
            >
              {option.name}
            </span>
            <span className="flex items-center gap-1.5 ml-3">
              {isLocked && (
                <CrownFilled
                  style={{
                    color: 'var(--color-premium-gold)',
                    fontSize: 10,
                  }}
                />
              )}
              {isActive && (
                <CheckOutlined
                  style={{ fontSize: 12, color: 'var(--accent)' }}
                />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      arrow={false}
      styles={{ content: POPOVER_CONTENT_STYLE }}
    >
      <Button
        type="text"
        size="small"
        icon={<FontSizeOutlined />}
        className="!text-[var(--sidebar-text)] !p-0 !w-5 !h-5 !min-w-0"
      />
    </Popover>
  )
}

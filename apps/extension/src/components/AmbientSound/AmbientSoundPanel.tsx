import { Slider } from 'antd'
import { CrownOutlined, LoadingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usePremium } from '@/hooks/usePremium'
import { PremiumBadge } from '../common/PremiumBadge'
import { SectionLabel } from '../common/SectionLabel'
import { AMBIENT_SOUNDS } from './constants'
import type { AmbientSoundType } from '@/services/ambientSoundEngine'

interface AmbientSoundPanelProps {
  currentSound: AmbientSoundType | null
  volume: number
  loadingSound: AmbientSoundType | null
  toggle: (type: AmbientSoundType) => void
  setVolume: (volume: number) => void
}

export function AmbientSoundPanel({
  currentSound,
  volume,
  loadingSound,
  toggle,
  setVolume,
}: AmbientSoundPanelProps) {
  const { t } = useTranslation('focus')
  const { isPremium, openPremiumModal } = usePremium()

  return (
    <div className="w-[264px] py-3 px-3">
      <div className="mb-3">
        <SectionLabel right={<PremiumBadge variant="label" size={11} />}>
          {t('ambient.title')}
        </SectionLabel>
        {!isPremium && (
          <div className="text-[10px] text-[var(--text-secondary)] opacity-60 mt-1">
            {t('ambient.previewHint')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {AMBIENT_SOUNDS.map((sound) => {
          const isActive = currentSound === sound.type
          const isLoading = loadingSound === sound.type
          return (
            <button
              key={sound.type}
              onClick={() => !isLoading && toggle(sound.type)}
              disabled={isLoading}
              className={`
                flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg
                border transition-all cursor-pointer
                ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent-light)]'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-secondary)]'
                }
                ${isLoading ? 'opacity-70 cursor-wait' : ''}
              `}
            >
              <span className="text-lg leading-none">
                {isLoading ? (
                  <LoadingOutlined style={{ fontSize: 18 }} />
                ) : (
                  sound.icon
                )}
              </span>
              <span
                className={`text-[10px] leading-tight ${
                  isActive
                    ? 'text-[var(--accent)] font-medium'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {t(sound.labelKey)}
              </span>
            </button>
          )
        })}
      </div>

      {isPremium ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)] shrink-0">
            {t('ambient.volume')}
          </span>
          <Slider
            min={0}
            max={100}
            value={volume}
            onChange={setVolume}
            className="flex-1"
            tooltip={{ formatter: (v) => `${v}%` }}
          />
        </div>
      ) : (
        <button
          onClick={openPremiumModal}
          className="w-full text-center text-[11px] py-1.5 rounded-md
            bg-[var(--accent-light)] text-[var(--accent)]
            hover:opacity-80 transition-opacity cursor-pointer
            border border-[var(--accent)] border-opacity-20"
        >
          <CrownOutlined className="mr-1" style={{ fontSize: 10 }} />
          {t('ambient.unlock')}
        </button>
      )}
    </div>
  )
}

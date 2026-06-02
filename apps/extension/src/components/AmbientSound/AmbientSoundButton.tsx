import { Popover, Button } from 'antd'
import { CustomerServiceOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useAmbientSound } from '@/hooks/useAmbientSound'
import { POPOVER_CONTENT_STYLE } from '@/constants/styles'
import { AmbientSoundPanel } from './AmbientSoundPanel'

export function AmbientSoundButton() {
  const [open, setOpen] = useState(false)
  const { isPlaying, currentSound, volume, loadingSound, toggle, setVolume } =
    useAmbientSound()

  return (
    <Popover
      content={
        <AmbientSoundPanel
          currentSound={currentSound}
          volume={volume}
          loadingSound={loadingSound}
          toggle={toggle}
          setVolume={setVolume}
        />
      }
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      arrow={false}
      styles={{ content: POPOVER_CONTENT_STYLE }}
    >
      <Button
        type="text"
        size="small"
        icon={<CustomerServiceOutlined />}
        className={`
          !text-[var(--text-secondary)] hover:!text-[var(--text-primary)]
          ${isPlaying ? 'animate-pulse !text-[var(--accent)]' : ''}
        `}
      />
    </Popover>
  )
}

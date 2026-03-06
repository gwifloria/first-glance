/**
 * 番茄钟设置弹窗
 * 提示音选择
 */
import { useState, useEffect } from 'react'
import { Modal, Radio } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSettings, setSettings } from '@/services/settingsStorage'
import {
  playNotificationSound,
  type NotificationSound,
} from '@/services/soundEngine'

interface PomodoroSettingsModalProps {
  open: boolean
  onClose: () => void
}

export function PomodoroSettingsModal({
  open,
  onClose,
}: PomodoroSettingsModalProps) {
  const { t } = useTranslation('focus')

  const [notifSound, setNotifSound] = useState<NotificationSound>('bell')

  useEffect(() => {
    if (open) {
      getSettings().then((s) => {
        setNotifSound(s.notificationSound)
      })
    }
  }, [open])

  const handleNotifChange = (value: NotificationSound) => {
    setNotifSound(value)
    setSettings({ notificationSound: value })
    playNotificationSound(value)
  }

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <SoundOutlined />
          {t('pomodoroSettings.title')}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={360}
    >
      <div className="pt-2">
        <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
          {t('pomodoroSettings.notifSound')}
        </div>
        <Radio.Group
          value={notifSound}
          onChange={(e) => handleNotifChange(e.target.value)}
          className="flex flex-col gap-1"
        >
          <Radio value="bell">{t('pomodoroSettings.bell')}</Radio>
          <Radio value="chime">{t('pomodoroSettings.chime')}</Radio>
          <Radio value="wood">{t('pomodoroSettings.wood')}</Radio>
          <Radio value="none">{t('pomodoroSettings.none')}</Radio>
        </Radio.Group>
      </div>
    </Modal>
  )
}

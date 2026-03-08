/**
 * 番茄钟设置弹窗
 * 提示音选择 + 工作/休息时长
 */
import { useState, useEffect } from 'react'
import { Modal, Radio, Slider } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
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

const WORK_MARKS: Record<number, string> = {
  5: '5',
  15: '15',
  25: '25',
  45: '45',
  60: '60',
}
const BREAK_MARKS: Record<number, string> = {
  1: '1',
  5: '5',
  10: '10',
  15: '15',
  30: '30',
}

export function PomodoroSettingsModal({
  open,
  onClose,
}: PomodoroSettingsModalProps) {
  const { t } = useTranslation('focus')

  const [notifSound, setNotifSound] = useState<NotificationSound>('bell')
  const [workDuration, setWorkDuration] = useState(25)
  const [breakDuration, setBreakDuration] = useState(5)

  useEffect(() => {
    if (open) {
      getSettings().then((s) => {
        setNotifSound(s.notificationSound)
        setWorkDuration(s.workDuration)
        setBreakDuration(s.breakDuration)
      })
    }
  }, [open])

  const handleNotifChange = (value: NotificationSound) => {
    setNotifSound(value)
    setSettings({ notificationSound: value })
    playNotificationSound(value)
  }

  const handleWorkChange = (value: number) => {
    setWorkDuration(value)
  }

  const handleWorkCommit = (value: number) => {
    setSettings({ workDuration: value })
  }

  const handleBreakChange = (value: number) => {
    setBreakDuration(value)
  }

  const handleBreakCommit = (value: number) => {
    setSettings({ breakDuration: value })
  }

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <SettingOutlined />
          {t('pomodoroSettings.title')}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div className="pt-2 space-y-5">
        {/* 工作时长 */}
        <div>
          <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {t('pomodoroSettings.workDuration')}
            <span className="ml-2 text-[var(--accent)] font-bold">
              {workDuration} {t('pomodoroSettings.minutes')}
            </span>
          </div>
          <Slider
            min={5}
            max={60}
            step={5}
            marks={WORK_MARKS}
            value={workDuration}
            onChange={handleWorkChange}
            onChangeComplete={handleWorkCommit}
          />
        </div>

        {/* 休息时长 */}
        <div>
          <div className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {t('pomodoroSettings.breakDuration')}
            <span className="ml-2 text-[var(--accent)] font-bold">
              {breakDuration} {t('pomodoroSettings.minutes')}
            </span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            marks={BREAK_MARKS}
            value={breakDuration}
            onChange={handleBreakChange}
            onChangeComplete={handleBreakCommit}
          />
        </div>

        {/* 提示音 */}
        <div>
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
      </div>
    </Modal>
  )
}

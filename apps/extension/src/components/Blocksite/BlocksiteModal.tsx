import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'
import { BlocksiteSettings } from './BlocksiteSettings'

interface BlocksiteModalProps {
  open: boolean
  onClose: () => void
}

export function BlocksiteModal({ open, onClose }: BlocksiteModalProps) {
  const { t } = useTranslation('settings')

  return (
    <Modal
      title={t('blocksite.label')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div className="mt-4">
        <BlocksiteSettings />
        <p className="text-xs text-[var(--text-secondary)] mt-3">
          {t('blocksite.hint')}
        </p>
      </div>
    </Modal>
  )
}

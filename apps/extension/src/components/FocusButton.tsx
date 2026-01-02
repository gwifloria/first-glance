import { Button } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'

interface FocusButtonProps {
  onClick: () => void
  size?: 'default' | 'large'
}

export function FocusButton({ onClick, size = 'default' }: FocusButtonProps) {
  return (
    <Button
      type="default"
      shape="round"
      size={size === 'large' ? 'large' : 'middle'}
      onClick={onClick}
      className="focus-btn"
    >
      <span className="focus-btn-border">
        <span className="focus-btn-gradient animate-spin-slow" />
      </span>
      <span className="focus-btn-bg" />
      <span className="focus-btn-content">
        <AppstoreOutlined />
        <span>FOCUS</span>
      </span>
    </Button>
  )
}

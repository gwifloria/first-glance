import { CheckOutlined } from '@ant-design/icons'
import './StampBadge.css'

interface StampBadgeProps {
  /** 印章内的短文案，可选 */
  text?: string
  /** 定位用的附加 class（由父级决定贴在哪） */
  className?: string
}

/**
 * 手帐盖章效果：accent 描边印章「啪」地盖下（回弹+轻微旋转），短暂停留后淡出。
 * 透明底、纯描边+彩字，贴在任意表面都可读。
 * 用法：父级用自增的 key 重挂载本组件来重放动画（key 变化即重新盖章）。
 * 动画走完停在 opacity 0，无需手动卸载。
 */
export function StampBadge({ text, className = '' }: StampBadgeProps) {
  return (
    <span className={`stamp-badge font-hand ${className}`} aria-hidden>
      <CheckOutlined className="stamp-badge__check" />
      {text && <span className="stamp-badge__text">{text}</span>}
    </span>
  )
}

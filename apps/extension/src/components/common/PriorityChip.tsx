import { Dropdown } from 'antd'
import './MetaChip.css'

interface PriorityOption {
  value: number
  label: string
  color: string
}

interface PriorityChipProps {
  value: number
  onChange: (value: number) => void
  options: PriorityOption[]
}

/**
 * 可点改的优先级 chip：默认透明展示当前优先级（色点 + 文案），点开下拉切换。
 * 让 FocusView「快捷入口默认高优先级」从隐性变成可见、可改。
 */
export function PriorityChip({ value, onChange, options }: PriorityChipProps) {
  const current = options.find((o) => o.value === value) ?? options[0]

  const items = options.map((opt) => ({
    key: String(opt.value),
    label: (
      <span className="flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: opt.color }}
        />
        {opt.label}
      </span>
    ),
  }))

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items,
        selectable: true,
        selectedKeys: [String(value)],
        onClick: ({ key }) => onChange(Number(key)),
      }}
    >
      <span className="meta-chip meta-chip--button">
        <span
          className="meta-chip__dot"
          style={{ background: current.color }}
        />
        <span className="meta-chip__name">{current.label}</span>
      </span>
    </Dropdown>
  )
}

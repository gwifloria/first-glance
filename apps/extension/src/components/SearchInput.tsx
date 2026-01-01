import { Input } from 'antd'
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索任务...',
}: SearchInputProps) {
  return (
    <div className="px-3 py-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        prefix={<SearchOutlined className="text-[var(--text-secondary)]" />}
        suffix={
          value && (
            <CloseCircleFilled
              className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              onClick={() => onChange('')}
            />
          )
        }
        className="!bg-black/[0.04] !rounded-lg !py-1.5 !text-sm [&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[var(--text-primary)] [&_.ant-input::placeholder]:!text-[var(--text-secondary)]"
        variant="borderless"
      />
    </div>
  )
}

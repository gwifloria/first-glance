import { Input } from 'antd'
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  const { t } = useTranslation('task')
  const placeholderText = placeholder ?? t('placeholder.search')
  return (
    <div className="px-3 py-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholderText}
        prefix={<SearchOutlined className="text-[var(--text-secondary)]" />}
        suffix={
          value && (
            <CloseCircleFilled
              className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
              onClick={() => onChange('')}
            />
          )
        }
        className="!bg-black/[0.04] !rounded-lg !py-1.5 !text-sm [&_.ant-input]:!bg-transparent"
        variant="borderless"
      />
    </div>
  )
}

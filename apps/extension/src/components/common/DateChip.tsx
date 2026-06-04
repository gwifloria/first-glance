import { DatePicker } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import './MetaChip.css'

interface DateChipProps {
  value: Dayjs | null
  onChange: (value: Dayjs | null) => void
}

/**
 * 可点改的日期 chip：用 borderless DatePicker，display 走相对标签（今天/明天/M月D日/无日期），
 * 点开是 antd 原生日期面板 + 今天/明天预设。用 DatePicker 而非 Calendar——后者带
 * Month/Year 切换器且切换时面板高度变化会抖动，不适合做日期选择。
 */
export function DateChip({ value, onChange }: DateChipProps) {
  const { t } = useTranslation('common')

  const formatLabel = (v: Dayjs) => {
    if (v.isSame(dayjs(), 'day')) return t('dateChip.today')
    if (v.isSame(dayjs().add(1, 'day'), 'day')) return t('dateChip.tomorrow')
    return v.format('M/D')
  }

  return (
    <DatePicker
      value={value}
      onChange={onChange}
      variant="borderless"
      size="small"
      inputReadOnly
      allowClear
      format={formatLabel}
      placeholder={t('dateChip.none')}
      suffixIcon={<CalendarOutlined />}
      presets={[
        { label: t('dateChip.today'), value: dayjs() },
        { label: t('dateChip.tomorrow'), value: dayjs().add(1, 'day') },
      ]}
      className="meta-chip-picker"
    />
  )
}

import { useState } from 'react'
import { FocusView } from '@/components/FocusView'
import { Onboarding } from '@/components/Onboarding'
import { getRandomQuote, type Quote } from '@/data/quotes'

interface FocusLayoutProps {
  onSwitchView?: () => void
}

export function FocusLayout({ onSwitchView }: FocusLayoutProps) {
  // 随机引言在 Layout 层初始化，避免 FocusView 重渲染时改变
  const [quote] = useState<Quote>(() => getRandomQuote())

  return (
    <>
      <Onboarding />
      <FocusView quote={quote} onSwitchView={onSwitchView} />
    </>
  )
}

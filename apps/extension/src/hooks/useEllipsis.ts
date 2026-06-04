import { useEffect, useState } from 'react'

/**
 * 加载中的动态省略号：active 时在 . / .. / ... 间循环（增长到 3 个后归 1），
 * 给「正在写入」一点呼吸感。停用时回到单点，调用方一般只在加载时显示。
 */
export function useEllipsis(active: boolean, intervalMs = 400): string {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])

  return dots
}

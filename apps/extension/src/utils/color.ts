/**
 * 根据十六进制颜色计算感知亮度，返回对比文字颜色
 */
export function contrastText(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#18181b' : '#ffffff'
}

/**
 * Todoist 项目/标签颜色：API 返回的是颜色「名称」（如 berry_red），
 * 不是 CSS 可用的 hex。这里映射成 hex 供 ProjectColorDot 渲染。
 * 取值对齐 Todoist 官方调色板。
 */
const TODOIST_COLOR_HEX: Record<string, string> = {
  berry_red: '#b8256f',
  red: '#db4035',
  orange: '#ff9933',
  yellow: '#fad000',
  olive_green: '#afb83b',
  lime_green: '#7ecc49',
  green: '#299438',
  mint_green: '#6accbc',
  teal: '#158fad',
  sky_blue: '#14aaf5',
  light_blue: '#96c3eb',
  blue: '#4073ff',
  grape: '#884dff',
  violet: '#af38eb',
  lavender: '#eb96eb',
  magenta: '#e05194',
  salmon: '#ff8d85',
  charcoal: '#808080',
  grey: '#b8b8b8',
  taupe: '#ccac93',
}

/** 颜色名 → hex；未知名或空值返回 undefined（由 UI 回退到默认色） */
export function todoistColorToHex(name?: string): string | undefined {
  if (!name) return undefined
  return TODOIST_COLOR_HEX[name]
}

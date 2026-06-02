/**
 * Ant Design 组件样式常量
 * 用于统一表单组件的外观
 * 注：基础颜色已通过 antdTheme 配置，这里只保留布局和特殊样式
 */

// 弹窗内的输入框/下拉位于「卡片表面」：填充用专为卡片内抬升设计的 --surface-raised
// （rgba 叠加，对深/浅卡片都能拉开层次），并加卡片表面的边框 --border-on-card（回退 --border）
// 做出明确边界，focus 时边框转 accent。避免输入框与弹窗底色糊在一起。
export const FORM_INPUT_STYLE =
  '!bg-[var(--surface-raised)] !rounded-xl !border !border-solid !border-[var(--border-on-card,var(--border))] !py-2.5 !px-4 !text-sm transition-colors [&_.ant-input]:!bg-transparent hover:!border-[var(--accent)] focus-within:!border-[var(--accent)] !shadow-none'

export const FORM_SELECT_STYLE =
  '[&_.ant-select-selector]:!bg-[var(--surface-raised)] [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border [&_.ant-select-selector]:!border-solid [&_.ant-select-selector]:!border-[var(--border-on-card,var(--border))] [&_.ant-select-selector]:!py-2 [&_.ant-select-selector]:!px-4 [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!shadow-none [&_.ant-select-selector]:transition-colors [&:hover_.ant-select-selector]:!border-[var(--accent)] [&.ant-select-focused_.ant-select-selector]:!border-[var(--accent)] [&_.ant-select-selection-item]:!text-sm'

// 圆角(=Modal.borderRadiusLG 16)、header 下边框(=headerBorderBottom none)、
// footer 虚线分隔(=footerBorderTop) 已走 token；这里只留无精确 token 的间距
export const MODAL_STYLE =
  '[&_.ant-modal-header]:!pb-0 [&_.ant-modal-body]:!pt-4 [&_.ant-modal-footer]:!mt-2 [&_.ant-modal-footer]:!pt-4'

// 弹窗按钮仅保留尺寸偏好（20px 内边距 / 36px 高）；
// 圆角(=全局 8)、字重(=Button.fontWeight 500)、去阴影(=Button.*Shadow:none) 已走 token
export const MODAL_BUTTON_STYLE = '!px-5 !h-9'

export const FORM_LAYOUT_STYLE =
  '[&_.ant-form-item]:!mb-4 [&_.ant-form-item-label>label]:!text-xs [&_.ant-form-item-label>label]:!font-normal [&_.ant-form-item-label]:!pb-1.5'

// 任务详情抽屉的正文排版：为「长读」调过 —— 行高 1.7、段落/列表间距收紧，
// 杀掉 loose markdown 在 <li> 里塞 <p> 造成的大间距，列表标记走次字色
export const TASK_DETAIL_PROSE_CLASS =
  'text-[15px] leading-[1.7] text-[var(--text-primary)] [&_p]:my-3 [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:my-1 [&_li]:marker:text-[var(--text-secondary)] [&_li>p]:!my-0 [&_strong]:font-semibold [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_a]:text-[var(--accent)] [&_a]:underline [&_code]:bg-[var(--surface-raised)] [&_code]:px-1 [&_code]:rounded [&_code]:text-[13px] [&_s]:line-through [&_del]:line-through [&_mark]:bg-[var(--surface-accent)] [&_mark]:text-[var(--text-primary)] [&_mark]:px-0.5 [&_mark]:rounded-sm'

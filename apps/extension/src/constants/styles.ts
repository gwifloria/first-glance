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

export const MODAL_STYLE =
  '[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!border-0 [&_.ant-modal-header]:!pb-0 [&_.ant-modal-body]:!pt-4 [&_.ant-modal-footer]:!border-t [&_.ant-modal-footer]:!border-dashed [&_.ant-modal-footer]:!border-[var(--border)] [&_.ant-modal-footer]:!mt-2 [&_.ant-modal-footer]:!pt-4'

export const MODAL_OK_BUTTON_STYLE =
  '!rounded-lg !px-5 !h-9 !text-sm !font-medium !shadow-none'

export const MODAL_CANCEL_BUTTON_STYLE =
  '!rounded-lg !px-5 !h-9 !text-sm !shadow-none'

export const FORM_LAYOUT_STYLE =
  '[&_.ant-form-item]:!mb-4 [&_.ant-form-item-label>label]:!text-xs [&_.ant-form-item-label>label]:!font-normal [&_.ant-form-item-label]:!pb-1.5'

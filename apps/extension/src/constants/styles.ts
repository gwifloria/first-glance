/**
 * Ant Design 组件样式常量
 * 用于统一表单组件的外观
 */

export const FORM_INPUT_STYLE =
  '!bg-[var(--bg-secondary)] !rounded-xl !border-0 !py-2.5 !px-4 !text-sm [&_.ant-input]:!bg-transparent [&_.ant-input]:!text-[var(--text-primary)] [&_.ant-input::placeholder]:!text-[var(--text-secondary)] hover:!bg-[var(--bg-secondary)]/80 focus:!bg-[var(--bg-secondary)]/80 focus-within:!bg-[var(--bg-secondary)]/80 !shadow-none'

export const FORM_SELECT_STYLE =
  '[&_.ant-select-selector]:!bg-[var(--bg-secondary)] [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!py-2 [&_.ant-select-selector]:!px-4 [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!shadow-none [&_.ant-select-selection-item]:!text-sm [&_.ant-select-selection-item]:!text-[var(--text-primary)] [&_.ant-select-arrow]:!text-[var(--text-secondary)]'

export const FORM_DATEPICKER_STYLE =
  '!bg-[var(--bg-secondary)] !rounded-xl !border-0 !py-2.5 !px-4 !shadow-none [&_.ant-picker-input>input]:!text-sm [&_.ant-picker-input>input]:!text-[var(--text-primary)] [&_.ant-picker-input>input::placeholder]:!text-[var(--text-secondary)] [&_.ant-picker-suffix]:!text-[var(--text-secondary)]'

export const MODAL_STYLE =
  '[&_.ant-modal-content]:!bg-[var(--bg-card)] [&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!bg-transparent [&_.ant-modal-header]:!border-0 [&_.ant-modal-header]:!pb-0 [&_.ant-modal-body]:!pt-4 [&_.ant-modal-footer]:!border-t [&_.ant-modal-footer]:!border-dashed [&_.ant-modal-footer]:!border-[var(--border)] [&_.ant-modal-footer]:!mt-2 [&_.ant-modal-footer]:!pt-4'

export const MODAL_OK_BUTTON_STYLE =
  '!bg-[var(--accent)] !border-0 !rounded-lg !px-5 !h-9 !text-sm !font-medium hover:!bg-[var(--accent)]/80 !shadow-none'

export const MODAL_CANCEL_BUTTON_STYLE =
  '!bg-transparent !border !border-[var(--border)] !rounded-lg !px-5 !h-9 !text-sm !text-[var(--text-secondary)] hover:!text-[var(--text-primary)] hover:!border-[var(--text-secondary)] !shadow-none'

export const FORM_LAYOUT_STYLE =
  '[&_.ant-form-item]:!mb-4 [&_.ant-form-item-label>label]:!text-xs [&_.ant-form-item-label>label]:!text-[var(--text-secondary)] [&_.ant-form-item-label>label]:!font-normal [&_.ant-form-item-label]:!pb-1.5'

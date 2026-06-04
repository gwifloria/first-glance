import { App } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import './JournalToast.css'

/**
 * 手帐贴纸风格的轻反馈 toast。
 * 复用 antd message 通道（拿 App 上下文实例，主题/层级都对），
 * 但内容换成手写字体 + 图标 + 小装饰，从顶部轻轻弹入、微微倾斜，像贴了张小贴纸。
 */
export function useJournalToast() {
  const { message } = App.useApp()

  /** 成功贴纸：对勾 + 文案 + 可定制的小装饰（不同场景换符号以作区分）。 */
  const showSaved = (text: string, deco = '｡˚✩') => {
    message.open({
      icon: null,
      className: 'journal-toast',
      duration: 1.8,
      content: (
        <span className="journal-toast__sticker font-hand">
          <CheckOutlined className="journal-toast__check" />
          <span>{text}</span>
          <span className="journal-toast__deco">{deco}</span>
        </span>
      ),
    })
  }

  /** 失败贴纸：同款手帐风，换 danger 色边框与叉号，停留略久让用户看清。 */
  const showError = (text: string) => {
    message.open({
      icon: null,
      className: 'journal-toast journal-toast--error',
      duration: 2.4,
      content: (
        <span className="journal-toast__sticker font-hand">
          <CloseOutlined className="journal-toast__check" />
          <span>{text}</span>
        </span>
      ),
    })
  }

  return { showSaved, showError }
}

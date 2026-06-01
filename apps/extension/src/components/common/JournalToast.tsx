import { App } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import './JournalToast.css'

/**
 * 手帐贴纸风格的成功 toast。
 * 复用 antd message 通道（拿 App 上下文实例，主题/层级都对），
 * 但内容换成手写字体 + 对勾 + 小装饰，从顶部轻轻弹入、微微倾斜，像贴了张小贴纸。
 */
export function useJournalToast() {
  const { message } = App.useApp()

  const showSaved = (text: string) => {
    message.open({
      icon: null,
      className: 'journal-toast',
      duration: 1.8,
      content: (
        <span className="journal-toast__sticker font-hand">
          <CheckOutlined className="journal-toast__check" />
          <span>{text}</span>
          <span className="journal-toast__deco">｡˚✩</span>
        </span>
      ),
    })
  }

  return { showSaved }
}

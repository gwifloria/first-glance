// Background Service Worker
// 处理 OAuth 回调和 token 刷新

chrome.runtime.onInstalled.addListener(() => {
  console.log('First Glance extension installed')
})

// 定时刷新 token（每 30 分钟检查一次）
chrome.alarms.create('refreshToken', { periodInMinutes: 30 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'refreshToken') {
    const result = await chrome.storage.local.get('auth_token')
    const token = result.auth_token

    if (token && token.expires_at) {
      // 如果 token 将在 10 分钟内过期，尝试刷新
      const tenMinutes = 10 * 60 * 1000
      if (Date.now() > token.expires_at - tenMinutes && token.refresh_token) {
        try {
          // 发送消息到 newtab 页面刷新 token
          chrome.runtime.sendMessage({ type: 'REFRESH_TOKEN' })
        } catch {
          // 忽略错误（可能没有活跃的 newtab 页面）
        }
      }
    }
  }
})

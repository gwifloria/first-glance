# Roadmap

First Glance 的功能里程碑与后续规划。最近更新：2026-05-28

## 已发布

### v1.6.0 · 2026-05
- 字体主题包（Premium）：DynaPuff / Playwrite / Mountains of Christmas，可调 S / M / L 字号
- 字体远程 CSS 走 `fonts.googleapis.cn` 官方中国域名，保证国内可访问

### v1.5.0 · 2026-04
- Premium 系统（LemonSqueezy license 激活 / 停用）
- 环境专注音（Premium）：雨声、篝火、海浪等，jsDelivr CDN 托管
- 非会员 15 秒免费试听
- 卸载反馈问卷

### 基础能力（v1.0 – v1.4）
- Focus / List 双视图；番茄钟（跨标签页同步）
- 智能列表：今天 / 明天 / 本周 / 逾期 / 收件箱
- 完整任务管理，适配滴答清单（TickTick）与 Todoist
- 游客模式（纯本地存储，限 3 个任务）
- 网站屏蔽 + Chill Mode（长按 10s 暂停屏蔽 15min）
- AI Buddy：对话式任务助手（OpenAI 兼容 API）
- 多主题：milk / beige / pink / blue / dark / twilight / cream
- 中英文国际化

## 进行中 / 待办

### 发布流程
- [ ] **2026-10-15 前验证 CWS API v2 发布**：已迁移到 `chrome-webstore-upload-cli@4.0.0`（Chrome Web Store API v2），`CWS_PUBLISHER_ID` secret 已配置；待下个版本 push tag 实地验证。旧 v1.1 API 到期后将失效。

## 未来规划

### 官网
- [ ] 更新官网，展示字体及新增 Premium 功能 —— 不急于单独更新，攒几个新功能后一起上线

### Premium 功能扩展
- [ ] 数据统计面板（基于已有 `focusStats` 数据）
- [ ] 番茄钟统计面板
- [ ] 数据导入 / 导出 —— 会员可导出数据，换设备后导入恢复，实现跨设备同步；走本地导入导出而非服务端云存储，省去维护后端

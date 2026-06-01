# Roadmap

First Glance 的功能里程碑与后续规划。最近更新：2026-05-28

## 已发布

### 待发布
- 数据统计面板（Premium）：环形连胜进度 + 累计总览（专注时长/番茄数/日均）；Trend / Hourly / Heatmap / Session Log 四标签（7 天趋势、24h 时段分布+黄金时段、90 天热力图、近期专注日志含任务名/优先级快照）；面板对所有人开放，会员专属图表打码引导解锁
- 番茄记录新增任务名/优先级快照（完成时冻结，供 Session Log 展示，不随任务改名/删除变化）
- 默认视图设置（Focus / List，存 chrome.storage.sync 跨设备；游客无 List 视图故仅连接后可选）
- 快速添加任务时的 loading 态（Focus 与 List 两个输入框，接口慢时不再像卡住）
- 看板/字体弹窗统一改用 antd 组件 + token，新增 `--surface-raised` 抬升表面，修复深浅主题对比度问题

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
- [x] 数据统计面板（基于已有 `focusStats` 数据）—— 含番茄钟统计，见上方「待发布」
- [ ] 数据导入 / 导出 —— 会员可导出数据，换设备后导入恢复，实现跨设备同步；走本地导入导出而非服务端云存储，省去维护后端

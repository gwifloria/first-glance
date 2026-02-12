# 隐私政策 | Privacy Policy

**最后更新 / Last Updated: 2026-02-12**

---

## 中文版

### 概述

「First Glance」是一款 Chrome 浏览器扩展，用于在新标签页展示任务管理工具的任务。支持连接滴答清单（Dida365/TickTick）和 Todoist，也可作为独立的本地任务管理工具使用。本隐私政策说明我们如何收集、使用和保护您的信息。

### 数据收集

本扩展收集和存储以下数据：

1. **账户授权信息**
   - 滴答清单 OAuth 访问令牌和刷新令牌（请求范围：tasks:read tasks:write）
   - Todoist OAuth 访问令牌（请求范围：data:read_write,data:delete）
   - 令牌存储在浏览器本地存储（chrome.storage.local）中

2. **用户偏好设置**
   - 主题选择、默认项目设置
   - 网站屏蔽列表
   - 存储在 Chrome 同步存储（chrome.storage.sync）中，支持跨设备同步

3. **任务数据缓存**
   - 从滴答清单或 Todoist API 获取的任务和项目数据
   - 仅缓存在本地（chrome.storage.local），用于提升加载速度

4. **番茄钟状态**
   - 计时器模式、开始时间、完成次数等状态信息
   - 存储在本地（chrome.storage.local），仅用于跨标签页同步

5. **游客模式数据**
   - 未连接任何服务时，最多 3 个本地任务
   - 完全存储在本地，不与任何外部服务通信

### 数据使用

- 所有数据仅用于扩展功能的正常运作
- 我们**不会**将您的数据发送到任何第三方服务器
- 我们**不会**收集任何分析数据或使用追踪
- 我们**不会**收集浏览历史或个人身份信息

### 第三方服务

本扩展根据您的选择，可连接以下任务管理服务之一：

1. **滴答清单（Dida365/TickTick）**
   - API 地址：api.dida365.com
   - 用于读取和管理您的任务、项目数据
   - 您的数据受滴答清单隐私政策保护：https://dida365.com/about/privacy

2. **Todoist**
   - API 地址：api.todoist.com/rest/v2
   - 用于读取和管理您的任务、项目数据
   - 您的数据受 Todoist 隐私政策保护：https://todoist.com/privacy

3. **游客模式（无需连接）**
   - 完全离线，所有数据存储在本地
   - 不与任何外部服务通信

### 权限说明

本扩展请求以下 Chrome 权限：

- `storage`：存储用户偏好、授权令牌和任务缓存
- `identity`：OAuth 登录流程，用于获取滴答清单或 Todoist 的授权
- `declarativeNetRequest`：网站屏蔽功能，仅拦截您手动配置的屏蔽网站并重定向到扩展页面，不会读取或收集任何网页内容
- `alarms`：定时任务，用于自动刷新授权令牌和管理休息模式（Chill Mode）计时
- 访问 `api.dida365.com`、`api.todoist.com`：获取和管理任务数据
- `<all_urls>`：仅用于 declarativeNetRequest 拦截用户自行配置的屏蔽网站，不会访问或读取任何网页内容

### 数据存储位置

- 所有数据存储在您的浏览器本地
- **chrome.storage.local**：授权令牌、任务缓存、番茄钟状态、游客模式任务
- **chrome.storage.sync**：用户偏好设置（主题、屏蔽网站列表），支持跨设备同步
- 我们没有服务器，不存储任何用户数据

### 数据删除

您可以随时：
- 在扩展中登出账户，清除授权信息
- 卸载扩展，删除所有本地数据
- 在滴答清单或 Todoist 的账户设置中撤销应用授权

### 联系方式

如有隐私相关问题，请通过以下方式联系：
- GitHub Issues: https://github.com/gwifloria/first-glance/issues

---

## English Version

### Overview

"First Glance" is a Chrome browser extension that displays tasks from your task management tools on the new tab page. It supports connecting to Dida365 (TickTick) and Todoist, and can also be used as a standalone local task manager. This privacy policy explains how we collect, use, and protect your information.

### Data Collection

This extension collects and stores the following data:

1. **Account Authorization**
   - Dida365 OAuth access and refresh tokens (scope: tasks:read tasks:write)
   - Todoist OAuth access token (scope: data:read_write,data:delete)
   - Tokens are stored in browser local storage (chrome.storage.local)

2. **User Preferences**
   - Theme selection, default project settings
   - Website blocking list
   - Stored in Chrome sync storage (chrome.storage.sync), synced across devices

3. **Task Data Cache**
   - Tasks and projects fetched from Dida365 or Todoist API
   - Cached locally only (chrome.storage.local) to improve loading speed

4. **Pomodoro Timer State**
   - Timer mode, start time, completion count, and other state
   - Stored locally (chrome.storage.local), only for cross-tab synchronization

5. **Guest Mode Data**
   - Up to 3 local tasks when not connected to any service
   - Stored entirely locally, no communication with external services

### Data Usage

- All data is used solely for the extension's functionality
- We do **NOT** send your data to any third-party servers
- We do **NOT** collect any analytics or tracking data
- We do **NOT** collect browsing history or personally identifiable information

### Third-Party Services

Based on your choice, this extension connects to one of the following task management services:

1. **Dida365 / TickTick**
   - API endpoint: api.dida365.com
   - Used to read and manage your tasks and projects
   - Your data is protected by Dida365's privacy policy: https://dida365.com/about/privacy

2. **Todoist**
   - API endpoint: api.todoist.com/rest/v2
   - Used to read and manage your tasks and projects
   - Your data is protected by Todoist's privacy policy: https://todoist.com/privacy

3. **Guest Mode (no connection required)**
   - Fully offline, all data stored locally
   - No communication with any external service

### Permissions Explained

This extension requests the following Chrome permissions:

- `storage`: Store user preferences, auth tokens, and task cache
- `identity`: OAuth login flow for Dida365 or Todoist authorization
- `declarativeNetRequest`: Website blocking feature. Only intercepts websites you manually configure and redirects to the extension page. Does not read or collect any web page content
- `alarms`: Scheduled tasks for automatic token refresh and Chill Mode (rest mode) timer management
- Access to `api.dida365.com`, `api.todoist.com`: Fetch and manage task data
- `<all_urls>`: Used solely for declarativeNetRequest to intercept user-configured blocked websites. Does not access or read any web page content

### Data Storage Location

- All data is stored locally in your browser
- **chrome.storage.local**: Auth tokens, task cache, Pomodoro timer state, guest mode tasks
- **chrome.storage.sync**: User preferences (theme, blocked sites list), synced across devices
- We have no servers and store no user data

### Data Deletion

You can at any time:
- Log out in the extension to clear authorization
- Uninstall the extension to delete all local data
- Revoke app access in your Dida365 or Todoist account settings

### Contact

For privacy-related questions, please contact us via:
- GitHub Issues: https://github.com/gwifloria/first-glance/issues

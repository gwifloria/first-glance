# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome 扩展：替换新标签页，展示滴答清单任务并支持完整操作（查看、标记完成、编辑、删除、新建）。支持 Focus/List 双视图、番茄钟、游客模式、多主题、中英文切换。

技术栈：React 19 + TypeScript 5.7 + Vite 6 + Ant Design + Tailwind CSS + i18next

## Commands

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建全部
pnpm build

# 类型检查
pnpm typecheck

# Lint
pnpm lint

# 仅构建扩展
pnpm --filter @first-glance/extension build

# 仅构建网站
pnpm --filter @first-glance/web build
```

## 开发配置

1. 复制 `apps/extension/.env.example` 为 `.env`，填入滴答清单 API 凭证
2. 运行 `pnpm build` 构建
3. Chrome 加载 `apps/extension/dist` 目录为解压的扩展

## Architecture

```
apps/
├── extension/                 # Chrome 扩展
│   └── src/
│       ├── newtab/            # 新标签页入口
│       │   ├── App.tsx        # 顶层路由（Focus/List 切换）
│       │   └── main.tsx       # React 初始化
│       ├── background/        # Service Worker
│       │   ├── index.ts       # 主入口，事件监听
│       │   └── services/      # 后台服务
│       │       ├── tokenRefresh.ts    # Token 刷新逻辑
│       │       ├── blockingRules.ts   # 网站屏蔽规则管理
│       │       └── chillMode.ts       # Chill Mode 后台逻辑
│       ├── components/        # React 组件
│       │   ├── FocusView/     # Focus 模式（时钟、任务、番茄钟）
│       │   ├── Sidebar/       # List 模式侧边栏（筛选、项目树）
│       │   ├── TaskList/      # 任务列表（分组、快速添加）
│       │   ├── Task/          # 任务卡片（编辑、完成）
│       │   ├── BlockedPage/   # 被屏蔽页面（ChillMode 入口）
│       │   └── common/        # 共用组件（Clock、Checkbox、ChillModeIndicator）
│       ├── contexts/          # React Context
│       │   ├── AppModeContext # 连接/游客模式
│       │   ├── TaskContext    # 任务数据统一源
│       │   ├── ThemeContext   # 主题状态
│       │   └── SettingsContext
│       ├── hooks/             # 自定义 Hooks
│       │   ├── usePomodoro    # 番茄钟（跨标签页同步）
│       │   ├── useTaskData    # 任务数据加载
│       │   └── useTaskViews   # 任务视图计算（分组、计数）
│       ├── api/adapters/      # 数据适配器
│       │   ├── DidaListAdapter  # 滴答清单 API
│       │   └── LocalAdapter     # 本地存储（游客模式）
│       ├── themes/            # 5 种主题定义
│       ├── i18n/              # 国际化（zh-CN、en）
│       ├── utils/             # 工具函数
│       │   └── taskFilters/   # 任务筛选/排序/分组
│       └── types/             # TypeScript 类型
└── web/                       # 项目官网（Astro）
```

## 核心概念

### Context 架构
- `AppModeContext`: 管理连接状态（connected/guest）
- `TaskContext`: 任务数据统一源，提供 data/actions/views/filters
- `ThemeContext`: 主题状态和切换
- `SettingsContext`: 用户设置（默认项目、屏蔽网站等）

### 适配器模式
- `ITaskAdapter` 接口定义统一的任务操作
- `DidaListAdapter`: 连接滴答清单 API
- `LocalAdapter`: 完全本地存储（游客模式，限 3 个任务）
- 工厂模式创建适配器实例

### 关键 Hooks
- `usePomodoro`: 番茄计时器，使用 Chrome Storage 实现跨标签页同步
- `useTaskData`: 任务数据加载，带错误恢复和缓存策略
- `useTaskViews`: 单次遍历计算所有派生数据（日期分组、计数）
- `useChillMode`: Chill Mode 状态管理，监听休息模式状态和倒计时
- `useVersionUpdate`: 版本更新检测，判断是否需要显示更新提示
- `usePersistedState<T>`: 通用持久化状态 Hook，封装 chrome.storage 读写

### 主题系统
- 5 种主题：milk、beige、pink、blue、dark
- CSS 变量动态注入
- 支持纹理和贴纸装饰（Journal 风格）

### 网站屏蔽机制
- 使用 Chrome `declarativeNetRequest` API 实现网站屏蔽
- 屏蔽规则动态更新，存储在 `chrome.storage.sync`
- 被屏蔽时重定向到 `BlockedPage` 组件
- 支持 Chill Mode（休息模式）：长按 10 秒触发，暂停屏蔽 15 分钟

### BlockedPage 组件
- `BlockedPage/index.tsx`: 被屏蔽页面主入口
- `ChillModePanel.tsx`: 休息模式触发面板（长按解锁）
- `KaomojiDisplay.tsx`: 随状态变化的颜文字显示
- `GoHomeButton.tsx`: 返回首页按钮
- `constants.ts`: Kaomoji 表情和阶段配置

## CI/CD

### GitHub Actions
- `deploy-web.yml`: push 到 main 时部署网站到 GitHub Pages
- `bump-version.yml`: 手动触发版本更新（patch/minor/major），同步更新 manifest.json
- `release.yml`: 创建 v* tag 时自动发布到 Chrome Web Store

### 分支策略
- `dev`: 开发分支，日常开发在此进行
- `staging`: 预发布分支，用于测试验证
- `main`: 生产分支，发布到 Chrome Web Store

### 发布流程
1. dev → staging: 创建 PR 合并到 staging，进行测试验证
2. staging → main: 测试通过后，创建 PR 合并到 main
3. 在 main 分支运行 bump-version workflow 选择版本类型
4. 自动创建 tag，触发 release workflow
5. 自动构建、打包、上传 Chrome Web Store

### PR 规范与 Changelog 生成
- PR 模板 (`.github/PULL_REQUEST_TEMPLATE.md`) 包含双语更新说明 section
- 创建 PR 时填写 "更新说明 / Release Notes" 中的中英文内容
- 添加合适的 label 进行分类：
  - `feature`: 新功能 → ✨ 新功能 / New Features
  - `bug`: Bug 修复 → 🐛 Bug 修复 / Bug Fixes
  - `improvement`: 优化改进 → 💄 优化 / Improvements
  - `skip-changelog`: 跳过 changelog（纯技术性变更）
- 发布时 release.yml 会自动从已合并 PR 中提取更新说明，生成双语 GitHub Release Notes

## 环境变量管理

### 新增 VITE 环境变量检查清单

新增 `VITE_*` 环境变量时，必须同步更新以下文件：

1. **`.env.example`** - 添加示例配置
2. **`src/vite-env.d.ts`** - TypeScript 类型声明
3. **`.github/workflows/release.yml`** - 发布流程
   - `Verify required secrets` 步骤添加校验
   - `Build` 步骤的 `env` 添加变量传递
4. **`.github/workflows/build-extension.yml`** - staging 构建
   - `Build` 步骤的 `env` 添加变量传递

### GitHub Secrets 配置

发布前需在 GitHub repo **Settings > Secrets and variables > Actions** 中配置对应的 secrets。

### 当前环境变量

| 变量名 | 用途 |
|--------|------|
| `VITE_DIDA_CLIENT_ID` | 滴答清单 OAuth Client ID |
| `VITE_DIDA_CLIENT_SECRET` | 滴答清单 OAuth Client Secret |
| `VITE_TODOIST_CLIENT_ID` | Todoist OAuth Client ID |
| `VITE_TODOIST_CLIENT_SECRET` | Todoist OAuth Client Secret |

## 外部 API

### 滴答清单
- Base URL: `https://api.dida365.com/open/v1`
- OAuth: `https://dida365.com/oauth/authorize`
- 文档: https://developer.dida365.com/docs

### Todoist
- Base URL: `https://api.todoist.com/rest/v2`
- OAuth: `https://todoist.com/oauth/authorize`
- 文档: https://developer.todoist.com/rest/v2/

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
│       │   └── index.ts       # OAuth 回调、Token 刷新、网站屏蔽
│       ├── components/        # React 组件
│       │   ├── FocusView/     # Focus 模式（时钟、任务、番茄钟）
│       │   ├── Sidebar/       # List 模式侧边栏（筛选、项目树）
│       │   ├── TaskList/      # 任务列表（分组、快速添加）
│       │   ├── Task/          # 任务卡片（编辑、完成）
│       │   └── common/        # 共用组件（Clock、Checkbox）
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

### 主题系统
- 5 种主题：milk、beige、pink、blue、dark
- CSS 变量动态注入
- 支持纹理和贴纸装饰（Journal 风格）

## CI/CD

### GitHub Actions
- `deploy-web.yml`: push 到 main 时部署网站到 GitHub Pages
- `bump-version.yml`: 手动触发版本更新（patch/minor/major），同步更新 manifest.json
- `release.yml`: 创建 v* tag 时自动发布到 Chrome Web Store

### 发布流程
1. 运行 bump-version workflow 选择版本类型
2. 自动创建 tag，触发 release workflow
3. 自动构建、打包、上传 Chrome Web Store

## 滴答清单 API

- Base URL: `https://api.dida365.com/open/v1`
- OAuth: `https://dida365.com/oauth/authorize`
- 文档: https://developer.dida365.com/docs

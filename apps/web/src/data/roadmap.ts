export interface RoadmapItem {
  id: string
  title: { zh: string; en: string }
  description: { zh: string; en: string }
  status: 'planned' | 'in-progress' | 'coming-soon'
  icon: string
}

export const roadmap: RoadmapItem[] = [
  {
    id: 'notion-integration',
    title: { zh: 'Notion 集成', en: 'Notion Integration' },
    description: {
      zh: '连接 Notion 数据库，在新标签页管理任务',
      en: 'Connect Notion databases to manage tasks from your new tab',
    },
    status: 'planned',
    icon: '📝',
  },
  {
    id: 'todoist-integration',
    title: { zh: 'Todoist 集成', en: 'Todoist Integration' },
    description: {
      zh: '支持 Todoist 作为任务数据源',
      en: 'Support Todoist as a task data source',
    },
    status: 'planned',
    icon: '✅',
  },
  {
    id: 'google-tasks-integration',
    title: { zh: 'Google Tasks 集成', en: 'Google Tasks Integration' },
    description: {
      zh: '支持 Google Tasks 作为任务数据源',
      en: 'Support Google Tasks as a task data source',
    },
    status: 'planned',
    icon: '📋',
  },
]

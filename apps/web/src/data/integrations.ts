export interface Integration {
  id: string
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  status: 'supported' | 'planned'
  icon: string
  logo?: string
}

export const integrations: Integration[] = [
  {
    id: 'dida',
    name: { zh: '滴答清单 (TickTick)', en: 'TickTick (滴答清单)' },
    description: {
      zh: '连接你的滴答清单账号，任务自动同步。在新标签页管理，变更实时生效。',
      en: 'Connect your TickTick account for automatic task sync. Manage from new tab, changes sync instantly.',
    },
    status: 'supported',
    icon: '✅',
    logo: '/first-glance/logos/ticktick.svg',
  },
  {
    id: 'todoist',
    name: { zh: 'Todoist', en: 'Todoist' },
    description: {
      zh: '连接你的 Todoist 账号，任务自动同步。在新标签页管理，变更实时生效。',
      en: 'Connect your Todoist account for automatic task sync. Manage from new tab, changes sync instantly.',
    },
    status: 'supported',
    icon: '✅',
    logo: '/first-glance/logos/todoist.svg',
  },
]

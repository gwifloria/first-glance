/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIDA_CLIENT_ID: string
  readonly VITE_DIDA_CLIENT_SECRET: string
  readonly VITE_TICKTICK_CLIENT_ID: string
  readonly VITE_TICKTICK_CLIENT_SECRET: string
  readonly VITE_TODOIST_CLIENT_ID: string
  readonly VITE_TODOIST_CLIENT_SECRET: string
  readonly VITE_BUDDY_BASE_URL?: string
  readonly VITE_BUDDY_API_KEY?: string
  readonly VITE_BUDDY_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

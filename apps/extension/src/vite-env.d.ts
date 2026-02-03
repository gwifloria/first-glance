/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIDA_CLIENT_ID: string
  readonly VITE_DIDA_CLIENT_SECRET: string
  readonly VITE_TODOIST_CLIENT_ID: string
  readonly VITE_TODOIST_CLIENT_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

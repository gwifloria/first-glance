import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import manifestJson from './manifest.json'

// 生产构建时移除 key（Chrome Web Store 不允许）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { key, ...prodManifest } = manifestJson

export default defineConfig(({ command, mode }) => {
  // mode: 'development' (yarn dev / yarn build:dev) 或 'production' (yarn build)
  const isRelease = command === 'build' && mode === 'production'
  const manifest = isRelease ? prodManifest : manifestJson

  return {
    plugins: [react(), crx({ manifest })],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    base: '',
    build: {
      outDir: isRelease ? 'build' : 'dist',
      emptyOutDir: true,
      // manualChunks 只在生产构建时使用，dev 模式下 @crxjs/vite-plugin 与此配置不兼容
      rollupOptions: isRelease
        ? {
            output: {
              manualChunks: {
                'vendor-react': ['react', 'react-dom'],
                'vendor-antd': ['antd'],
              },
            },
          }
        : undefined,
    },
  }
})

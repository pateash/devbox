import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'node:path'

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: { resolve: { alias: { '@renderer': resolve('src/renderer') } }, server: { proxy: { '/devbox-api': 'http://127.0.0.1:4317' } } }
})

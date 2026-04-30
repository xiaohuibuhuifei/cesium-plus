import path from 'node:path';
import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  plugins: [vue()],
  define: {
    // 与 scripts/copy-cesium-assets.mjs 的目标目录保持一致
    CESIUM_BASE_URL: JSON.stringify('/cesium/'),
  },
  publicDir: 'public',
  server: {
    port: 9527,
    strictPort: true,
  },
  resolve: {
    alias: {
      // 示例开发时直接指向源码，避免必须先发布或 npm link
      'cesium-plus': path.resolve(root, '../../src/index.ts'),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    emptyOutDir: true,
    outDir: 'dist',
  },
});

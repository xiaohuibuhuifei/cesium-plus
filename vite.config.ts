import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    rollupOptions: {
      // Cesium 是对等依赖，库包不能把它打进去。
      external: ['cesium'],
    },
    sourcemap: true,
  },
});

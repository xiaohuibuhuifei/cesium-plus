import { rmSync } from 'node:fs';

// 只清理构建产物，不碰源码和复制到 public 的 Cesium 运行时资源
for (const path of ['dist', 'examples/vue3/dist']) {
  rmSync(path, {
    force: true,
    recursive: true,
  });
}

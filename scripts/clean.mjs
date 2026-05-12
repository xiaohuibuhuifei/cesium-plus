import { rmSync } from 'node:fs';

// 只清理库构建产物，不碰源码或宿主侧 Cesium 运行时资源
for (const path of ['dist']) {
  rmSync(path, {
    force: true,
    recursive: true,
  });
}

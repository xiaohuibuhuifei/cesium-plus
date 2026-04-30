import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const cesiumPackagePath = require.resolve('cesium/package.json');
const cesiumRoot = path.dirname(cesiumPackagePath);
const cesiumBuildRoot = path.join(cesiumRoot, 'Build', 'Cesium');
const targetRoot = path.resolve('examples/vue3/public/cesium');
// 这些目录是 Cesium 运行时按 CESIUM_BASE_URL 动态请求的资源。
const assetDirs = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

rmSync(targetRoot, {
  force: true,
  recursive: true,
});
mkdirSync(targetRoot, {
  recursive: true,
});

for (const dir of assetDirs) {
  const source = path.join(cesiumBuildRoot, dir);
  const target = path.join(targetRoot, dir);

  if (!existsSync(source)) {
    throw new Error(`缺少 Cesium 静态资源目录：${source}`);
  }

  cpSync(source, target, {
    recursive: true,
  });
}

console.log(`已复制 Cesium 静态资源到 ${targetRoot}`);

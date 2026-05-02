# Cesium Plus

[English](./README.md)

面向 CesiumJS 的框架无关增强工具库。

Cesium Plus 不修改 Cesium，不替换 `Viewer`，也不注册全局副作用。宿主应用负责创建、配置和销毁 Cesium `Viewer`；这个包只绑定调用方传入的 viewer，在 `CesiumPlus` 上提供少量内置能力，并通过插件系统提供可释放的扩展能力。

## 安装

```sh
npm install cesium-plus cesium
```

`cesium` 是 peer dependency。Cesium Plus 兼容 `cesium >=1.70.0 <2`。

## 快速开始

```ts
import { Viewer } from 'cesium';
import { create } from 'cesium-plus';

const viewer = new Viewer('cesiumContainer');
const plus = create(viewer);

if (plus.coordinates.canWatchMouse) {
  plus.coordinates.watchMouse(({ longitude, latitude, height }) => {
    console.log(`${longitude.toFixed(6)}, ${latitude.toFixed(6)}, ${height.toFixed(1)}m`);
  });
}

// 在下一帧渲染后截图。
const dataUrl = await plus.capture.screenshot({ format: 'jpeg', quality: 0.9 });
await plus.capture.downloadScreenshot({ filename: 'map.jpeg', format: 'jpeg' });

plus.dispose();
```

`create(viewer)` 只创建增强管理器，不创建、不销毁、不替换 Cesium `Viewer`。

`dispose()` 会释放已安装插件和内置监听。等待中的截图会被拒绝；调用方没有手动清理的坐标监听也会被兜底释放。

完整 API 参考见 [docs/api.md](./docs/api.md)。

## 核心边界

- Cesium Plus 是 CesiumJS 增强库，不是应用框架，也不是 CesiumJS 替代品。
- 宿主应用拥有 Cesium `Viewer` 生命周期。
- Cesium Plus 不打包 Cesium 静态资源。运行时资源必须由宿主应用托管。
- Vue、React 等框架集成属于宿主应用或示例代码，不进入库 API。

## 框架集成

Vue、React 等框架应在自己的生命周期里创建 Cesium `Viewer`，把它传给
`create(viewer)`，并在卸载时调用 `dispose()`。

## Cesium 静态资源

CesiumJS 运行时需要由宿主应用托管静态资源。这个配置应该留在应用侧，不要藏进增强库里。

运行内置 Vue 3 + Vite 示例：

```sh
npm run dev:example
```

示例项目也是公开 API 和内置能力的手工全功能测试台。运行后检查画布是否渲染、插件列表是否包含 `scene-status`、`coordinates.canWatchMouse` 为 true 时鼠标悬停测试目标是否更新坐标、`capture` 是否生成 PNG 预览和下载，以及释放/重建是否能干净切换生命周期。

## 脚本

```sh
npm run lint
npm run typecheck
npm run test
npm run test:example
npm run test:full
npm run build
npm run build:example
npm run pack:check
npm run release:check
npm run release:dry-run
```

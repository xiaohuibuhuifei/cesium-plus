# Cesium Plus

Framework-agnostic enhancement toolkit for CesiumJS.

Cesium Plus does not modify Cesium, replace `Viewer`, or register global side effects. The application is responsible for creating and configuring Cesium; this package provides a small built-in capability surface on `CesiumPlus` and disposable enhancements through a plugin system.

## Install

```sh
npm install cesium-plus cesium
```

`cesium` is a peer dependency. Compatible with `cesium >=1.70.0 <2`.

## Quick Start

```ts
import { Viewer } from 'cesium';
import { create } from 'cesium-plus';

const viewer = new Viewer('cesiumContainer');
const plus = create(viewer);

plus.coordinates.watch({
  onMove({ longitude, latitude, height }) {
    console.log(
      `${longitude.toFixed(6)}, ${latitude.toFixed(6)}, ${height.toFixed(1)}m`,
    );
  },
});

// Capture after the next rendered frame.
const dataUrl = await plus.capture.screenshot();
await plus.capture.downloadScreenshot({ filename: 'map.png' });

plus.dispose();
```

`CesiumPlus.create(viewer)` only creates the enhancement manager. It does not create, destroy, or replace the Cesium `Viewer`. `createCesiumPlus(viewer)` is also available as an alias.

See [docs/api.md](./docs/api.md) for the full API reference.

## Framework Integration

Vue, React, and other frameworks should create the Cesium `Viewer` in their own lifecycle, pass it to `CesiumPlus.create(viewer)`, and call `dispose()` on unmount.

## Cesium Static Assets

CesiumJS requires the host application to serve static assets at runtime. This configuration stays on the application side and is not handled by this package.

Run the built-in Vue 3 + Vite example:

```sh
npm run dev:example
```

The example is a manual full-feature test bench for the public API, built-in
modules, and plugins. Verify that the Cesium canvas renders, installed plugin
names include `scene-status`, hovering the test target updates the coordinate
readout through `coordinates`, capture creates a PNG preview/download, and
release/rebuild moves the viewer through a clean lifecycle.

## Scripts

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

Release workflow: [docs/release.md](./docs/release.md).

---

## 中文说明

面向 CesiumJS 的框架无关增强工具。

Cesium Plus 不修改 Cesium，不替换 `Viewer`，也不注册全局副作用。应用负责创建和配置 Cesium；这个包在 `CesiumPlus` 上提供少量内置能力，并通过插件系统提供可释放的扩展能力。

`CesiumPlus.create(viewer)` 只创建增强管理器，不创建、不销毁、不替换 Cesium `Viewer`。`createCesiumPlus(viewer)` 会继续保留为别名。

CesiumJS 运行时需要由宿主应用托管静态资源。这个配置应该留在应用侧，不要藏进增强库里。

脚本会把 Cesium 的 `Workers`、`ThirdParty`、`Assets`、`Widgets` 目录复制到 `examples/vue3/public/cesium`，并把 `CESIUM_BASE_URL` 设置为 `/cesium/`。

Vue、React 等框架应在自己的生命周期里创建 Cesium `Viewer`，把它传给 `CesiumPlus.create(viewer)`，并在卸载时调用 `dispose()`。

示例项目现在也是公开 API 和内置能力的手工全功能测试台。运行 `npm run dev:example` 后，检查画布是否渲染、插件列表是否包含 `scene-status`、鼠标悬停测试目标是否通过 `coordinates` 更新坐标、`capture` 是否生成 PNG 预览和下载，以及释放/重建是否能干净切换生命周期。自动化全量检查使用 `npm run test:full`。

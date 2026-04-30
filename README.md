# Cesium Plus

Framework-agnostic enhancement toolkit for CesiumJS.

Cesium Plus does not modify Cesium, replace `Viewer`, or register global side effects. The application is responsible for creating and configuring Cesium; this package only provides explicitly installed, disposable enhancements through a plugin system.

## Install

```sh
npm install cesium-plus cesium
```

`cesium` is a peer dependency. Compatible with `cesium >=1.70.0 <2`.

## Quick Start

```ts
import { Viewer } from 'cesium';
import { create, coordinateReadout, screenshot } from 'cesium-plus';

const viewer = new Viewer('cesiumContainer');

const plus = create(viewer)
  .use(
    coordinateReadout({
      onMove({ longitude, latitude, height }) {
        console.log(`${longitude.toFixed(6)}, ${latitude.toFixed(6)}, ${height.toFixed(1)}m`);
      },
    }),
  )
  .use(screenshot());

// Take a screenshot at any time:
// plus.pluginInstances[1].takeScreenshot()

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

## Scripts

```sh
npm run lint
npm run typecheck
npm run test
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

Cesium Plus 不修改 Cesium，不替换 `Viewer`，也不注册全局副作用。应用负责创建和配置 Cesium；这个包只提供显式安装、可释放的增强能力。

`CesiumPlus.create(viewer)` 只创建增强管理器，不创建、不销毁、不替换 Cesium `Viewer`。`createCesiumPlus(viewer)` 会继续保留为别名。

CesiumJS 运行时需要由宿主应用托管静态资源。这个配置应该留在应用侧，不要藏进增强库里。

脚本会把 Cesium 的 `Workers`、`ThirdParty`、`Assets`、`Widgets` 目录复制到 `examples/vue3/public/cesium`，并把 `CESIUM_BASE_URL` 设置为 `/cesium/`。

Vue、React 等框架应在自己的生命周期里创建 Cesium `Viewer`，把它传给 `CesiumPlus.create(viewer)`，并在卸载时调用 `dispose()`。

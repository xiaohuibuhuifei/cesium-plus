# Cesium Plus

[English](./README.md)

面向 CesiumJS 的任务型增强工具库。

Cesium Plus 不替换 Cesium，不创建 `Viewer`，也不隐藏原生 Cesium 对象。宿主应用负责创建、配置和销毁 Cesium `Viewer`；Cesium Plus 只绑定这个 viewer，并提供相机、场景、截图、坐标和高级插件这几类高频任务能力。

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

plus.camera.setCameraView({
  lng: 116.3913,
  lat: 39.9075,
  alt: 6500,
  pitch: -45,
});

plus.camera.watchCameraChanged((view) => {
  console.log(view.lng, view.lat, view.alt);
});

plus.scene.requestRender();
await plus.scene.afterNextRender();

const dataUrl = await plus.capture.screenshot({
  format: 'jpeg',
  quality: 0.9,
});

if (plus.coordinates.canWatchMouse) {
  plus.coordinates.watchMouse(({ longitude, latitude, height }) => {
    console.log(longitude, latitude, height);
  });
}

console.log(dataUrl);
plus.dispose();
```

`create(viewer)` 只会创建增强管理器，不会创建、销毁或替换 Cesium `Viewer`。

`dispose()` 会释放已安装插件和内置监听。等待中的截图、场景渲染等待和相机飞行会被拒绝；调用方没有手动清理的坐标监听和相机监听会被兜底释放。

完整 API 参考见 [docs/api.md](./docs/api.md)。

## 核心边界

- Cesium Plus 是 CesiumJS 增强库，不是应用框架，也不是 CesiumJS 替代品。
- 宿主应用拥有 Cesium `Viewer` 生命周期。
- `viewer` 会继续暴露给调用方，作为高级 Cesium 用法的逃生口。
- Cesium Plus 不打包 Cesium 静态资源。运行时资源必须由宿主应用托管。
- 当前仓库不再内置 demo 工程。宿主集成和演示项目应放在业务应用或独立 demo 仓库里。

## 框架集成

Vue、React 等框架应在自己的生命周期里创建 Cesium `Viewer`，把它传给 `create(viewer)`，并在卸载时调用 `dispose()`。

## Cesium 静态资源

CesiumJS 运行时需要由宿主应用托管静态资源。这个配置应该留在应用侧，不要藏进增强库里。

## 脚本

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:full
npm run pack:check
npm run release:check
npm run release:dry-run
```

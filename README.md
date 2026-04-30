# Cesium Plus

面向 CesiumJS 的框架无关增强工具。

Cesium Plus 不修改 Cesium，不替换 `Viewer`，也不注册全局副作用。应用负责创建和配置 Cesium；这个包只提供显式安装、可释放的增强能力。

## 安装

```sh
npm install cesium-plus cesium
```

`cesium-plus` 将 Cesium 作为对等依赖处理，兼容范围为 `cesium >=1.70.0 <2`。开发和示例构建会使用仓库里的当前 Cesium 开发依赖版本验证。

## 使用

```ts
import { Viewer } from 'cesium';
import * as CesiumPlus from 'cesium-plus';

const viewer = new Viewer('cesiumContainer');

const plus = CesiumPlus.create(viewer).use(
  CesiumPlus.definePlugin({
    name: 'example',
    install: ({ viewer }) => {
      const listener = () => {
        // 只使用 Cesium 公开 API。
      };

      viewer.clock.onTick.addEventListener(listener);
      return () => viewer.clock.onTick.removeEventListener(listener);
    },
  }),
);

plus.dispose();
```

`CesiumPlus.create(viewer)` 只创建增强管理器，不创建、不销毁、不替换 Cesium `Viewer`。如果你已经在使用旧写法，`createCesiumPlus(viewer)` 会继续保留。

详细 API 见 [docs/api.md](./docs/api.md)。

## Cesium 静态资源

CesiumJS 运行时需要由宿主应用托管静态资源。这个配置应该留在应用侧，不要藏进增强库里。

运行内置 Vue 3 + Vite 示例：

```sh
npm run dev:example
```

示例开发服务默认启动在 `http://localhost:9527/`。

脚本会把 Cesium 的 `Workers`、`ThirdParty`、`Assets`、`Widgets` 目录复制到 `examples/vue3/public/cesium`，并把 `CESIUM_BASE_URL` 设置为 `/cesium/`。

## 框架接入

Vue、React 等框架应在自己的生命周期里创建 Cesium `Viewer`，把它传给 `CesiumPlus.create(viewer)`，并在卸载时调用 `dispose()`。

## 脚本

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run build:example
npm run pack:check
```

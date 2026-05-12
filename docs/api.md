# API

Cesium Plus 只绑定调用方传入的 Cesium `Viewer`，在 `CesiumPlus` 上提供任务型模块能力，并通过插件系统管理可释放的高级扩展。它不创建、不销毁、不替换 `Viewer`，也不隐藏 Cesium 静态资源配置。

## create

```ts
function create(viewer: Viewer): CesiumPlus;
```

`create` 会用调用方传入的 `Viewer` 创建一个 `CesiumPlus` 实例。

传入空值会抛出 `TypeError`。

## CesiumPlus

```ts
class CesiumPlus {
  readonly viewer: Viewer;
  readonly disposed: boolean;
  readonly pluginNames: readonly string[];
  readonly camera: CesiumPlusCamera;
  readonly scene: CesiumPlusScene;
  readonly capture: CesiumPlusCapture;
  readonly coordinates: CesiumPlusCoordinates;

  use(plugin: CesiumPlusPlugin): this;
  dispose(): void;
}
```

### viewer

调用方传入的原始 Cesium `Viewer`。Cesium Plus 不接管它的生命周期。

### disposed

实例是否已经释放。释放后不能继续安装插件或继续使用内置能力。

### pluginNames

已安装插件名，按安装顺序返回。first-party 模块不进入这个列表；插件释放后列表会清空。

### camera

相机任务能力，覆盖读取视角、设置视角、飞行到点位、取消飞行和相机变化监听。

```ts
const view = plus.camera.getCameraView();

plus.camera.setCameraView({
  lng: 116.3913,
  lat: 39.9075,
  alt: 6500,
  pitch: -45,
});

await plus.camera.flyToPoint(
  {
    lng: 116.3913,
    lat: 39.9075,
  },
  {
    alt: 5000,
    duration: 2,
    pitch: -35,
  },
);
```

### scene

场景渲染任务能力，覆盖显式请求渲染和等待下一次 `postRender`。

```ts
plus.scene.requestRender();
await plus.scene.afterNextRender();
```

### capture

内置画布捕获能力。截图会通过 `scene.afterNextRender()` 请求下一帧渲染，并在 `postRender` 后读取 canvas。调用方使用 `png`、`jpeg`、`webp` 这样的业务格式，不需要直接写 canvas MIME。

```ts
const dataUrl = await plus.capture.screenshot({ format: 'jpeg', quality: 0.9 });
await plus.capture.downloadScreenshot({ filename: 'map.jpeg', format: 'jpeg' });
```

### coordinates

内置鼠标坐标能力。`canWatchMouse` 表示当前 Scene 是否支持鼠标坐标监听。`watchMouse(callback)` 会监听鼠标移动并返回幂等清理函数；如果调用方没有手动清理，`CesiumPlus.dispose()` 会兜底释放。

```ts
if (plus.coordinates.canWatchMouse) {
  const stopWatching = plus.coordinates.watchMouse(({ longitude, latitude, height }) => {
    console.log(longitude, latitude, height);
  });

  stopWatching();
}
```

### use

安装插件并返回当前实例，方便链式调用。

同名插件只会安装一次。插件必须是对象，必须有非空且不含首尾空白的 `name`，并且 `install` 必须是函数。`install` 可以不返回值，也可以返回释放回调；返回其他值会抛出 `TypeError`。

实例释放后调用 `use` 会抛出错误。

### dispose

释放所有已安装插件。释放回调按安装顺序反向执行。

`dispose` 可以重复调用；第一次释放后再次调用不会做任何事。如果一个或多个释放回调抛错，所有释放回调仍会继续执行，最后抛出 `AggregateError`。

释放时会同时清理内置模块资源。等待中的截图、等待中的场景渲染、等待中的相机飞行会被拒绝；未手动清理的相机监听和坐标监听会被兜底释放。

## definePlugin

```ts
function definePlugin(plugin: CesiumPlusPlugin): CesiumPlusPlugin;
```

校验并返回原插件对象。这个函数不安装插件，只用于让插件定义处更明确。

## Camera

```ts
interface CesiumPlusCamera {
  getCameraView(): CameraView;
  setCameraView(view: CameraView): void;
  flyToPoint(point: LngLatPoint, options?: FlyToPointOptions): Promise<void>;
  cancelFlight(): void;
  watchCameraChanged(callback: CameraChangedCallback): CesiumPlusCleanup;
}

interface LngLatPoint {
  readonly lng: number;
  readonly lat: number;
  readonly alt?: number;
}

interface CameraView extends LngLatPoint {
  readonly alt: number;
  readonly heading?: number;
  readonly pitch?: number;
  readonly roll?: number;
}

interface FlyToPointOptions {
  readonly alt?: number;
  readonly duration?: number;
  readonly heading?: number;
  readonly pitch?: number;
  readonly roll?: number;
}

type CameraChangedCallback = (view: CameraView) => void;
```

`LngLatPoint` 和 `CameraView` 都使用经纬度、米和角度值，而不是直接暴露 Cesium 内部数学类型。

`getCameraView()` 返回当前视角快照。`heading`、`pitch`、`roll` 都是角度值。

`setCameraView()` 会立即设置相机视角；如果当前 Scene 暴露了 `requestRender()`，Cesium Plus 会顺手请求一次渲染。

`flyToPoint()` 会返回一个 Promise。飞行完成时 resolve；如果调用 `cancelFlight()` 或 `dispose()`，等待中的 Promise 会 reject。

`watchCameraChanged()` 需要一个 callback 函数，并返回幂等清理函数。

## Scene

```ts
interface CesiumPlusScene {
  requestRender(): void;
  afterNextRender(): Promise<void>;
}
```

`requestRender()` 只显式请求当前 Scene 渲染下一帧，不注册常驻监听。

`afterNextRender()` 会请求一次渲染，并在下一次 `postRender` 后 resolve。实例释放时，等待中的 Promise 会被拒绝。

## Capture

```ts
interface CesiumPlusCapture {
  screenshot(options?: ScreenshotOptions): Promise<string>;
  downloadScreenshot(options?: DownloadScreenshotOptions): Promise<string>;
}

type ScreenshotFormat = 'png' | 'jpeg' | 'webp';

interface ScreenshotOptions {
  readonly format?: ScreenshotFormat;
  readonly quality?: number;
}

interface DownloadScreenshotOptions extends ScreenshotOptions {
  readonly filename?: string;
}
```

`screenshot()` 默认返回 PNG data URL。`format` 默认是 `png`，并由 Cesium Plus 映射到 canvas MIME：`png -> image/png`、`jpeg -> image/jpeg`、`webp -> image/webp`。`quality` 必须是 `0` 到 `1` 之间的数字，只在浏览器支持的格式上生效。

`downloadScreenshot()` 复用同一次截图并触发浏览器下载。没有传入 `filename` 时，默认文件名随格式生成：`cesium-plus-screenshot.png`、`cesium-plus-screenshot.jpeg` 或 `cesium-plus-screenshot.webp`。

参数无效时会抛出 `TypeError`。实例释放后调用截图能力会抛出错误。如果截图正在等待下一次 `postRender`，`dispose()` 会移除监听并拒绝这个 Promise。

如果宿主关闭默认渲染循环或浏览器仍返回黑图，可以在创建 `Viewer` 时把 WebGL `preserveDrawingBuffer` 作为兜底配置；正常路径不要求它。

## Coordinates

```ts
interface CesiumPlusCoordinates {
  readonly canWatchMouse: boolean;
  watchMouse(callback: CoordinateWatchCallback): CesiumPlusCleanup;
}

type CoordinateWatchCallback = (coord: CoordinatePosition) => void;

interface CoordinatePosition {
  readonly longitude: number;
  readonly latitude: number;
  readonly height: number;
}
```

`coordinates.canWatchMouse` 为 `true` 时，`coordinates.watchMouse(callback)` 可以从鼠标位置读取场景坐标。回调中的 `longitude` / `latitude` 为角度值，`height` 为 Cesium 返回的高度。

`watchMouse()` 需要一个 callback 函数。参数无效时会抛出 `TypeError`。实例释放后继续监听，或当前 Scene 不支持 `pickPosition` 时，会抛出错误。

## Plugin Types

```ts
type CesiumPlusCleanup = () => void;

interface CesiumPlusPluginContext {
  readonly viewer: Viewer;
  readonly plus: CesiumPlus;
}

interface CesiumPlusPlugin {
  readonly name: string;
  install(context: CesiumPlusPluginContext): void | CesiumPlusCleanup;
}
```

插件应只使用 Cesium 公开 API。需要释放事件监听、图元、定时器等资源时，从 `install` 返回一个清理函数。

## 迁移说明

| 旧写法                                       | 新写法                                   |
| -------------------------------------------- | ---------------------------------------- |
| `capture.screenshot({ type: 'image/jpeg' })` | `capture.screenshot({ format: 'jpeg' })` |
| `coordinates.isSupported`                    | `coordinates.canWatchMouse`              |
| `coordinates.watch({ onMove })`              | `coordinates.watchMouse(onMove)`         |

仓库内置的 `examples` 项目已经移除；后续 demo 请放到独立仓库或宿主应用中维护。

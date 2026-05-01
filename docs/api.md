# API

Cesium Plus 只绑定调用方传入的 Cesium `Viewer`，在 `CesiumPlus` 上提供少量内置能力，并通过插件系统管理可释放的扩展能力。它不创建、不销毁、不替换 `Viewer`，也不隐藏 Cesium 静态资源配置。

## create

```ts
function create(viewer: Viewer): CesiumPlus;
function createCesiumPlus(viewer: Viewer): CesiumPlus;
```

`create` 是 `createCesiumPlus` 的短别名。两者都会用调用方传入的 `Viewer` 创建一个 `CesiumPlus` 实例。

传入空值会抛出 `TypeError`。

## CesiumPlus

```ts
class CesiumPlus {
  readonly viewer: Viewer;
  readonly disposed: boolean;
  readonly pluginNames: readonly string[];
  readonly capture: CesiumPlusCapture;
  readonly coordinates: CesiumPlusCoordinates;

  use(plugin: CesiumPlusPlugin): this;
  dispose(): void;
}
```

### viewer

调用方传入的原始 Cesium `Viewer`。Cesium Plus 不接管它的生命周期。

### disposed

实例是否已经释放。释放后不能继续安装插件。

### pluginNames

已安装插件名，按安装顺序返回。插件释放后会清空。

### capture

内置画布捕获能力，不需要通过插件安装。截图会请求下一帧渲染，并在 `postRender` 后读取 canvas，避免把截图命令伪装成插件生命周期。

```ts
const dataUrl = await plus.capture.screenshot();
await plus.capture.downloadScreenshot({ filename: 'map.png' });
```

### coordinates

内置坐标能力，不需要通过插件安装。`isSupported` 表示当前 Scene 是否支持基于 `pickPosition` 的坐标监听。`watch()` 会监听鼠标移动并返回清理函数；如果调用方没有手动清理，`CesiumPlus.dispose()` 会兜底释放。

```ts
if (plus.coordinates.isSupported) {
  const stopWatching = plus.coordinates.watch({
    onMove({ longitude, latitude, height }) {
      console.log(longitude, latitude, height);
    },
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

释放时会同时清理内置模块资源。等待中的截图会移除 `postRender` 监听并拒绝 Promise；未手动清理的坐标监听会被兜底释放。

## definePlugin

```ts
function definePlugin(plugin: CesiumPlusPlugin): CesiumPlusPlugin;
```

校验并返回原插件对象。这个函数不安装插件，只用于让插件定义处更明确。

## Capture

```ts
interface CesiumPlusCapture {
  screenshot(options?: ScreenshotOptions): Promise<string>;
  downloadScreenshot(options?: DownloadScreenshotOptions): Promise<string>;
}

interface ScreenshotOptions {
  readonly type?: string;
  readonly quality?: number;
}

interface DownloadScreenshotOptions extends ScreenshotOptions {
  readonly filename?: string;
}
```

`screenshot()` 默认返回 PNG data URL。`type` 和 `quality` 会直接传给 canvas `toDataURL`。`downloadScreenshot()` 复用同一次截图并触发浏览器下载，默认文件名是 `cesium-plus-screenshot.png`。

实例释放后调用截图能力会抛出错误。如果截图正在等待下一次 `postRender`，`dispose()` 会移除监听并拒绝这个 Promise。

如果宿主关闭默认渲染循环或浏览器仍返回黑图，可以在创建 `Viewer` 时把 WebGL `preserveDrawingBuffer` 作为兜底配置；正常路径不要求它。

## Coordinates

```ts
interface CesiumPlusCoordinates {
  readonly isSupported: boolean;
  watch(options: CoordinateWatchOptions): CesiumPlusCleanup;
}

interface CoordinateWatchOptions {
  readonly onMove: (coord: CoordinatePosition) => void;
}

interface CoordinatePosition {
  readonly longitude: number;
  readonly latitude: number;
  readonly height: number;
}
```

`coordinates.isSupported` 为 `true` 时，`coordinates.watch()` 可以从 Cesium `pickPosition` 读取鼠标所在位置，回调中的 `longitude` / `latitude` 为角度值，`height` 为 Cesium 返回的高度。

`watch()` 需要 options 对象和 `onMove` 函数。参数无效时会抛出 `TypeError`。实例释放后继续监听，或当前 Scene 不支持 `pickPosition` 时，会抛出错误。

## Types

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

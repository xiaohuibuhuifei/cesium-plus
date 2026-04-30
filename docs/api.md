# API

Cesium Plus 只管理调用方传入的 Cesium `Viewer` 上的增强插件。它不创建、不销毁、不替换 `Viewer`，也不隐藏 Cesium 静态资源配置。

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

### use

安装插件并返回当前实例，方便链式调用。

同名插件只会安装一次。插件必须是对象，必须有非空 `name`，并且 `install` 必须是函数。`install` 可以不返回值，也可以返回释放回调；返回其他值会抛出 `TypeError`。

实例释放后调用 `use` 会抛出错误。

### dispose

释放所有已安装插件。释放回调按安装顺序反向执行。

`dispose` 可以重复调用；第一次释放后再次调用不会做任何事。如果一个或多个释放回调抛错，所有释放回调仍会继续执行，最后抛出 `AggregateError`。

## definePlugin

```ts
function definePlugin(plugin: CesiumPlusPlugin): CesiumPlusPlugin;
```

校验并返回原插件对象。这个函数不安装插件，只用于让插件定义处更明确。

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

# 变更日志

[English](./CHANGELOG.md)

本项目的所有重要变更都会记录在这个文件中。
本项目遵循 [Semantic Versioning](https://semver.org/)。

## [未发布]

### 新增

- `CesiumPlus.capture`：按需画布截图和下载能力。
- `CesiumPlus.coordinates`：鼠标移动坐标监听能力。
- `CesiumPlus.coordinates.canWatchMouse`：用于判断运行时是否支持鼠标坐标监听
  的能力标记。

### 修复

- `CesiumPlus.dispose()` 执行时，等待中的截图会移除 `postRender` 监听并拒绝
  Promise。

### 移除

- 移除预发布阶段的 `createCesiumPlus(viewer)` 工厂函数别名。请使用
  `create(viewer)`。
- 移除预发布阶段的 `ScreenshotOptions.type` MIME 选项。请改用
  `format: 'png' | 'jpeg' | 'webp'`。
- 移除预发布阶段的 `coordinates.isSupported` 和
  `coordinates.watch({ onMove })`。请改用 `coordinates.canWatchMouse` 和
  `coordinates.watchMouse(onMove)`。

### 变更

- 截图能力现在会为普通 JavaScript 调用方校验 `format`、`quality` 和
  `filename`。
- `coordinates.watchMouse()` 现在会为普通 JavaScript 调用方校验 callback。
- `coordinates.watchMouse()` 现在会在当前 Scene 不支持 `pickPosition` 时抛出清晰错误。
- 插件名称现在会拒绝首尾空白。

## 0.1.0 - 待定

### 新增

- `CesiumPlus` 类：提供按插件名去重和反向释放的插件管理器。
- `create(viewer)`：工厂函数。
- `definePlugin(plugin)`：运行时校验辅助函数。
- TypeScript 类型声明。
- 带 source map 的 ESM 构建产物。
- Node 20 / 22 / 24 CI 流水线。
- Vue 3 + Vite 示例。

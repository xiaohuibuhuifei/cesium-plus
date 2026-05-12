# Task API Design

- 先从用户任务命名，不从 Cesium 内部类命名。
- 优先提供普通对象输入输出，例如经纬高和角度值；不要把调用方逼到 `Cartesian3`、`Cartographic`、MIME 这类底层细节上。
- 多个语义参数或多个可选项时用 options object；单一事件监听优先 callback-first。
- API 目标是减少调用方的 import、坐标转换、资源清理和样板代码，而不是重新包装整套 Cesium 类型体系。
- 方法命名优先清晰，例如 `setCameraView()`、`flyToPoint()`、`downloadScreenshot()`。
- 高级场景允许用户直接回到 `viewer` 和原生 Cesium API。

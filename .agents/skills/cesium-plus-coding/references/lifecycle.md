# Lifecycle And Cleanup

- 任何创建 Cesium 对象、浏览器监听器、定时器、事件 handler 或等待中的异步任务的代码，都必须有明确释放策略。
- `dispose()` / `destroy()` / cleanup 必须幂等。
- 释放多个资源时必须继续执行剩余释放，最后再汇总错误为 `AggregateError`。
- 默认显式启用、零常驻成本：只有调用 `watch*`、截图、等待渲染、飞行等任务方法时才产生运行时成本。
- first-party 模块和插件都不能重复销毁调用方拥有的底层资源。
- `postRender`、`camera.changed`、`pickPosition` 这类不明显行为必须由测试固定边界。

# Cesium Plus AI 编码规则

## 基本判断

每次改动前先回答三个问题：

1. 这是真问题，还是过度设计？
2. 有没有更简单的数据结构或控制流？
3. 会不会破坏现有用户的代码？

答案不清楚就先读代码、测试、`README.md` 和 `docs/api.md`，不要靠猜。

## 项目边界

- 这是面向 CesiumJS 的框架无关增强库，不是应用框架，也不是 CesiumJS 替代品。
- 调用方创建、配置、销毁 Cesium `Viewer`。库只绑定传入的 `Viewer`，不得创建、替换、隐藏、全局缓存或接管它。
- `cesium` 只能是 peer dependency。不要打进 bundle，不要移动到 dependencies，不要在库源码里复制或托管 Cesium 静态资源。
- 保持 `sideEffects: false` 的承诺。库入口不得注册全局状态、DOM、样式、定时器、事件监听或 Cesium Viewer。
- Vue、React 等框架只属于示例或宿主集成说明。库 API 不得硬耦合任何前端框架。
- 公开 API 以 `src/index.ts`、`README.md`、`docs/api.md` 和测试共同约束；新增能力必须保持旧 API 可用。

## 代码规则

- TypeScript 保持严格模式：不要绕过 `strict`、`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`isolatedModules`。
- 使用 ESM 和显式 `.js` 相对导入，保留 type-only import。
- 公共类型不得暴露 `any`；不确定输入用 `unknown` 并在运行时收窄。
- 数据结构优先于分支补丁。能用统一清理函数、集合或映射表达的逻辑，不要堆特殊情况。
- `dispose()` / `destroy()` / cleanup 必须幂等；释放多个资源时继续执行剩余清理，最后再汇总错误。
- 插件按名称去重，释放顺序必须和安装顺序相反。
- 内置能力不进入插件列表；插件列表只描述调用方安装的插件。
- 普通 JavaScript 用户传错值时也要得到稳定、可解释的运行时错误；TypeScript 类型不能替代运行时校验。
- 错误信息、测试名和项目内注释以中文为主。公开 npm 介绍可以保留英文和中文并存。

## 注释规则

- 遵循标准 JS/TS 开源库注释规范，公开 API 使用 JSDoc/TypeDoc 友好的 `/** */`。
- 导出的 class、function、公共 method、行为型 interface/type 必须写 JSDoc，说明签名看不出的公共契约、生命周期、释放责任、副作用、默认值、错误条件或兼容性边界。
- `@param` 只写参数语义、单位、默认值或约束；`@returns` 只写返回值语义；`@throws` 只写公开错误条件；需要时可用 `@example`、`@deprecated`、`@see`。
- 不为 TypeScript 已表达的类型补 `@type`，不写只重复函数名、参数名、返回类型的空 JSDoc。
- 纯结构类型不强制写顶层 JSDoc；字段存在单位、默认值、范围、生命周期或副作用时才写字段注释。
- 内部实现注释只解释不变量、依赖方向、兼容性边界和不明显的 Cesium 或浏览器行为。

## 发布规则

- npm 包只发布构建产物和 `README.md`。
- `package.json` 由 npm 必然包含，`LICENSE` 可能被 npm 自动包含；这两者不算违背发布边界。
- 不发布 `docs/**`、`src/**`、`test/**`、`examples/**`、`.agents/**`、`AGENTS.md`、`node_modules/**`、Cesium 静态资源或示例构建产物。
- 改 `package.json.files`、`exports`、`types`、构建脚本、peer range 或发布流程后必须跑 `npm run pack:check`。

## 验证规则

普通代码改动至少执行：

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
```

影响构建、导出、类型或发布边界时追加：

```sh
npm run build
npm run pack:check
```

示例或 Cesium 静态资源流程改动时追加：

```sh
npm run build:example
```

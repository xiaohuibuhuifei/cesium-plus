---
name: cesium-plus-coding
description: Enforce Cesium Plus project rules for open-source JavaScript/TypeScript library development. Use when modifying D:/m-works/cesium-plus source, public APIs, exports, types, tests, examples, documentation, JSDoc/comments, dependencies, package metadata, release packaging, npm publish contents, or when reviewing/refactoring Cesium Plus code so AI coding stays within stable API, Cesium lifecycle, test, documentation, and release boundaries.
---

# Cesium Plus Coding

把这个 skill 当成 Cesium Plus 的项目宪法，不要当成风格建议。它要把高层偏好变成可执行、可检查的硬约束。

## 执行流程

1. 先读仓库根目录 `AGENTS.md`，再用 `ace-tool` 检索相关实现、测试、README 和 docs。不要凭文件名、记忆或直觉改代码。
2. 开始前判断三件事：这是真问题还是过度设计；有没有更简单的数据结构或控制流；会不会破坏现有用户。
3. 给改动分类：bugfix、feature、refactor、docs、example、release、dependency、test 或 skill。
4. 明确是否影响公开 API、类型声明、运行时行为、默认值、错误语义、打包内容、Cesium 生命周期或浏览器/Node 运行边界。
5. 小改动直接做最小可维护实现；大改动或 API 设计不清楚时，先收敛接口和兼容策略。
6. 结束前按“验证矩阵”跑命令，并说明改了什么、是否改公开 API、跑了哪些检查、哪些检查未跑。

## 开源库硬约束

- 默认不破坏用户代码。删除导出、重命名 API、改变选项含义、改变返回结构、改变默认行为、改变错误类型、改变清理顺序、降低运行时支持范围，都按 breaking change 处理。
- breaking change 必须有明确收益、迁移说明和 SemVer 版本策略；能保留兼容入口就保留，必要时新增 API 并标记旧 API deprecated。
- 公开 API 必须稳定、可预测、类型明确，并能被普通 JavaScript 用户以清晰错误信息使用。
- 不暴露内部模块为公共 API。示例、README 和外部文档只能使用 `src/index.ts` 导出的公开入口。
- 不做无关重构。不要为了“顺手优化”改不相关文件、重排无关代码或扩大 diff。
- 不引入隐藏魔法。行为、默认值、副作用、生命周期和清理责任必须能从 API、类型、文档或测试中看出来。

## Cesium Plus 边界

- Cesium Plus 是 CesiumJS 的增强库，不是 CesiumJS 替代品，也不是应用框架。
- 调用方创建、配置、销毁 Cesium `Viewer`。库只绑定传入的 `Viewer`，不得创建、替换、隐藏、全局缓存或接管它。
- 必须允许用户继续访问原生 Cesium 对象和 API。不要为了封装阻断高级用户回到 CesiumJS。
- `cesium` 只能是 peer dependency。不要放进 dependencies，不要打进 bundle，不要在库源码里复制或托管 Cesium 静态资源。
- 库入口必须保持 `sideEffects: false` 的承诺。不得注册全局状态、DOM、样式、定时器、事件监听或 Viewer。
- Vue、React 等框架只属于示例或宿主集成说明。库 API 不得硬耦合任何前端框架。
- 内置能力不进入插件列表；插件列表只描述调用方安装的插件。

## API 与类型

- 公开 API 以 `src/index.ts`、`README.md`、`README.zh-CN.md`、`docs/api.md` 和测试共同约束；新增或修改公开能力时必须同步这些面。
- 新导出必须从 `src/index.ts` 明确导出，并在构建后生成 `.d.ts`。
- 未经用户明确批准，不删除兼容入口；删除公开 API 时必须同步源码导出、类型、README、`docs/api.md`、CHANGELOG 和测试。
- 函数超过两个语义参数时，优先使用 options object。不要把多个布尔参数堆进公开 API。
- 公开返回值必须结构稳定。不要同一个 API 在不同分支返回完全不同的对象形状。
- 公共类型不得暴露 `any`。不确定输入用 `unknown`，在运行时收窄。
- 类型设计优先使用 `readonly`、窄接口和显式返回值。不要导出内部实现类，除非它本身就是稳定抽象。
- 错误信息必须面向用户、可解释，并以中文为主；公共 API 错误应能定位到 Cesium Plus 或具体模块。不要抛 plain string。

## 易用 API 设计

- 先从用户任务命名，不从 Cesium 内部类命名；API 应描述“截图、下载截图、监听鼠标坐标”这类动作，而不是暴露 `ScreenSpaceEventHandler`、MIME、`Cartographic` 等底层细节。
- 能用普通对象、字面量联合类型或 callback 表达，就不要强迫用户传 Cesium 类型；需要高级能力时保留 `viewer` 逃生口。
- 能减少调用方 import、分支、坐标转换、资源清理和魔法字符串，才算比 Cesium 官方 API 更好用。
- 能用 callback-first 的单一参数表达事件监听时，不要包一层 `{ onMove }`；多个语义参数或可选项超过一个时才使用 options object。
- 命名清晰优先于短；`downloadScreenshot()` 这种自解释名称比含糊的 `download()` 更适合公开 API。
- 公开 options 使用用户语言：例如截图格式用 `format: 'png' | 'jpeg' | 'webp'`，不要让普通用户写 `image/png` 这类底层 MIME。
- 新增或修改公开 API 必须先写出 README 示例和 `docs/api.md` 契约，再让实现、测试、示例与文档保持一致。

## TypeScript 与实现

- 保持 strict 配置：不要绕过 `strict`、`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`、`isolatedModules` 或 `verbatimModuleSyntax`。
- 使用 ESM；相对运行时导入必须带 `.js` 后缀；类型导入使用 type-only import。
- 不用 `@ts-ignore`、全局 `eslint-disable`、非空断言或 `any` 逃避设计问题。确实需要局部例外时，必须写出具体理由。
- 优先设计数据结构，而不是堆 if/else 补丁。超过三层缩进时，重排数据流或拆函数。
- 代码必须可读、可测、可释放。避免聪明但难维护的写法；不要提前优化没有证据的问题。
- 常量用清晰名称表达含义。布尔值名称优先使用 `is`、`has`、`can`、`should`、`allow` 前缀。
- 不提交 debug log、死代码、未使用导出或无上下文 TODO。TODO 必须说明原因或关联 issue。

## Cesium 资源与生命周期

- 任何创建 Cesium 对象、浏览器监听器、定时器、事件 handler、primitive、entity、data source 或插件资源的代码，都必须有明确释放策略。
- `dispose()` / `destroy()` / cleanup 必须幂等；释放多个资源时必须继续执行剩余清理，最后再汇总错误。
- 插件按名称去重；释放顺序必须和安装顺序相反。
- 调用方和 Cesium Plus 都可能持有同一资源时，清理函数必须避免重复销毁底层 Cesium 对象或监听器。
- 不要在每帧做昂贵操作，除非功能确实要求且有清晰边界。
- Cesium render loop、`postRender`、`ScreenSpaceEventHandler`、`pickPosition` 等不明显行为必须用测试或注释固定边界。

## JSDoc 与注释

- 遵循标准 JS/TS 开源库注释规范，公开 API 使用 JSDoc/TypeDoc 友好的 `/** */`。
- 必须写 JSDoc：导出的 class、function、公共 method、行为型 interface/type，以及用户需要理解生命周期或释放责任的公共成员。
- JSDoc 第一段用一句话说明用途。后续只写签名看不出的契约：生命周期、释放责任、副作用、默认值、单位、范围、错误条件、兼容性边界。
- `@param` 只写参数语义、单位、默认值或约束；`@returns` 只写返回值语义；`@throws` 只写公开错误条件。
- 按需使用 `@example`、`@deprecated`、`@see`。弃用 API 必须用 `@deprecated` 说明替代方案。
- 不为 TypeScript 已表达的类型补 `@type`，不写只重复函数名、参数名、返回类型的空 JSDoc。
- 纯结构类型不强制写顶层 JSDoc。options、DTO、坐标/结果对象只有字段存在单位、默认值、范围、生命周期或副作用不明显时才写字段注释。
- 不写 JSDoc：内部实现类、private helper、已由接口说明覆盖的实现方法、模块内部工厂函数。
- 允许的实现注释：解释不变量、依赖方向、兼容性边界、浏览器/Cesium 规避方案。禁止复述代码。

## 测试与文档

- 行为变化必须有测试。新增公开 API 至少覆盖成功路径、无效输入、释放后调用和资源清理。
- bugfix 必须补回归测试，证明旧 bug 不会回来。
- 测试断言公开行为，不锁死无关实现细节；不要为了通过测试削弱断言。
- Mock Cesium 时只模拟当前测试需要的最小接口。不要复制 Cesium 类型体系。
- `README.md` 面向全球 npm 消费者，必须保持英文，并保留安装、快速开始、核心边界和脚本。
- `README.zh-CN.md` 是中文镜像；改公开 API、默认行为、生命周期、发布边界或脚本时，必须和英文 README 同步。
- `docs/api.md` 用于仓库内 API 细节；不要假设它会随 npm 包发布。
- `CHANGELOG.md` 保持英文，`CHANGELOG.zh-CN.md` 保持中文镜像；只记录用户可见变化，不写内部重排流水账。
- 示例必须只使用公开 API，保持最小但完整。不要把内部或实验 API 放进示例。

## 依赖与发布

- 新运行时依赖必须证明必要性。能用平台 API、现有 Cesium API 或小型内部工具解决的，不加依赖。
- 添加依赖前必须检查维护状态、bundle 影响、浏览器兼容、许可证风险和长期价值。
- 构建、测试、类型、发布工具放 devDependencies；运行时依赖必须有明确理由。
- `exports`、`main`、`types`、`dist/**` 必须互相一致。
- npm 包只发布 `dist/**`、`README.md` 和 `README.zh-CN.md`；接受 npm 自动包含 `package.json` 和 `LICENSE`。
- 不发布 `CHANGELOG*.md`、`docs/**`、`src/**`、`test/**`、`examples/**`、`.agents/**`、`AGENTS.md`、`node_modules/**`、Cesium 静态资源或示例构建产物。
- 改 `package.json.files`、`exports`、`types`、构建脚本、peer range 或发布流程后，必须跑 `npm run pack:check`。
- 发布前不要绕过 `prepublishOnly`。坏版本发布后不能用同一个版本号重发。

## Review 与交付

- code review 时先给品味判断，再列风险：破坏用户、生命周期泄漏、类型逃逸、发布污染、测试缺口、无关重构。
- 任务完成必须满足：实现完成；公开 API 类型明确；公开 API 文档完整；行为有测试；现有测试通过；构建和发布边界未被污染；没有无关文件改动。
- 如果用户要求 commit，使用 Conventional Commits：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`。
- 最终回复必须说明：改了什么；影响哪些文件；公开 API 是否变化；测试/构建/pack 是否已跑；兼容或迁移注意事项。

## 验证矩阵

普通代码改动：

```sh
npm run format:check
npm run lint
npm run typecheck
npm run test
```

构建、导出、类型或发布边界改动：

```sh
npm run build
npm run pack:check
```

示例、Cesium 静态资源或宿主集成改动：

```sh
npm run build:example
```

skill 自身改动：

```sh
npm run format:check
$env:PYTHONUTF8='1'; python C:/Users/xiaoh/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/cesium-plus-coding
```

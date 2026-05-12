---
name: cesium-plus-coding
description: Enforce Cesium Plus rules for task-oriented CesiumJS library development. Use when modifying D:/m-works/cesium-plus source, public APIs, types, tests, documentation, package metadata, release packaging, npm publish contents, or when reviewing/refactoring Cesium Plus code so changes stay within stable API, Cesium lifecycle, validation, and release boundaries.
---

# Cesium Plus Coding

把这个 skill 当成 Cesium Plus 的项目宪法，不要当成风格建议。

## 执行流程

1. 先读仓库根目录 `AGENTS.md`，再看 `src/index.ts`、相关模块、测试、`README.md`、`README.zh-CN.md`、`docs/api.md` 和 `package.json`。不要靠猜。
2. 开始前先问三件事：这是真问题还是过度设计；有没有更简单的数据结构或控制流；会不会破坏现有用户。
3. 给改动分类：bugfix、feature、refactor、docs、release、dependency、test 或 skill。
4. 明确是否影响公开 API、类型声明、默认行为、错误语义、Cesium 生命周期、打包内容或发布边界。
5. 只做与任务直接相关的改动；不要顺手重排无关代码。
6. 改公开 API 时，同步源码导出、测试、README、中文 README 和 `docs/api.md`。
7. 结束前跑验证矩阵，并在最终回复里说明公开 API 是否变化、跑了哪些检查、哪些没跑。

## 不可违反的规则

- Cesium Plus 是任务型增强库，不是应用框架，也不是 CesiumJS 替代品。
- 调用方创建、配置、销毁 `Viewer`；库只绑定传入的 `Viewer`，不得接管生命周期。
- `viewer` 必须继续暴露为原生 Cesium 逃生口；不要为了封装阻断高级用法。
- first-party 模块不进入 `pluginNames`；插件列表只描述调用方安装的插件。
- 默认显式启用、零常驻成本：不默认注册长期监听、不起后台循环、不建全局缓存。
- 普通 JavaScript 用户也必须收到稳定、可解释、以中文为主的运行时错误。
- `cesium` 只能是 peer dependency；不能打进 bundle，也不能把静态资源藏进库里。
- npm 包只发布 `dist/**`、`README.md` 和 `README.zh-CN.md`。

## 参考文件

- 任务型 API 设计：`references/api-design.md`
- 生命周期与资源释放：`references/lifecycle.md`
- 文档同步要求：`references/docs-sync.md`
- 发布与依赖边界：`references/release-boundaries.md`

按需打开这些 references，不要把细则全塞回 SKILL 主体。

## 交付要求

- 公开 API 类型明确，且从 `src/index.ts` 明确导出。
- 行为变化必须有测试；回归修复必须有回归测试。
- 文档只描述公开入口，不暴露内部模块路径。
- 不提交 debug log、死代码、无上下文 TODO 或与任务无关的重排。

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

skill 自身改动：

```sh
npm run format:check
$env:PYTHONUTF8='1'; python C:/Users/xiaoh/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/cesium-plus-coding
```

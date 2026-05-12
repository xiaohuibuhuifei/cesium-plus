# Release Boundaries

- `cesium` 只能是 peer dependency，不进 runtime bundle。
- npm 包只发布 `dist/**`、`README.md` 和 `README.zh-CN.md`。
- 不发布 `CHANGELOG*.md`、`docs/**`、`src/**`、`test/**`、`examples/**`、`.agents/**`、`AGENTS.md`、`node_modules/**`。
- 改 `package.json.files`、`exports`、`types`、构建脚本、peer range 或发布流程后，必须跑 `npm run pack:check`。
- 发布前不要绕过 `prepublishOnly`。

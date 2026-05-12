# Documentation Sync

- 公开 API 变动时，同步修改 `README.md`、`README.zh-CN.md`、`docs/api.md` 和测试。
- 根文档 `README.md` 保持英文，`README.zh-CN.md` 保持中文镜像。
- `docs/api.md` 只描述公开入口、稳定类型、默认值、错误条件和生命周期边界。
- 不在仓库里维护宿主演示工程；需要 demo 时放到独立仓库或宿主应用中。
- 文档示例只能使用 `src/index.ts` 导出的公开 API。

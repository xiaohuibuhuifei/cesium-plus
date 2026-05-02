# 发布流程

这个包只发布构建产物、`README.md` 和 `README.zh-CN.md`，不发布 `docs`、源码、测试、示例构建产物或 Cesium 静态资源。发布前不要绕过 `prepublishOnly`，坏包一旦发出去，同一个 `name@version` 就不能重发。

## 前置检查

使用官方 npm registry：

```sh
npm config get registry
```

输出必须是：

```text
https://registry.npmjs.org/
```

首次真实发布前登录 npm：

```sh
npm login --registry=https://registry.npmjs.org/
npm whoami
```

发布前重新确认包名和版本状态：

```sh
npm view cesium-plus name version dist-tags --json
```

如果 `cesium-plus` 仍未发布，npm 会返回 `E404`。这对首次发布是正常的。发布后不能复用已经发布过的版本号。

## 本地干跑

从干净依赖开始：

```sh
npm ci
npm run release:check
npm run release:dry-run
```

`release:check` 会执行 lint、类型检查、测试、构建和包内容预览。`release:dry-run` 会按真实发布命令走 npm 发布流程，但不会写入 registry。

## 包内容检查

检查 tarball 内容：

```sh
npm run pack:check
```

预期只包含这些类别：

```text
LICENSE
README.md
README.zh-CN.md
dist/**
package.json
```

`README.md` 是 npm 默认英文入口，`README.zh-CN.md` 是中文镜像入口。`package.json` 由 npm 必然包含，`LICENSE` 可能被 npm 自动包含。不要把 `CHANGELOG*.md`、`docs/`、`src/`、`test/`、`examples/vue3/dist/`、`examples/vue3/public/cesium/`、`.agents/`、`AGENTS.md` 或 `node_modules/` 发进包里。

## 消费端烟测

生成本地 tarball：

```sh
npm pack
```

在一个空目录里安装并验证 ESM 导出：

```sh
npm init -y
npm install /path/to/cesium-plus-0.1.0.tgz cesium
node --input-type=module -e "import('cesium-plus').then((m)=>console.log(Object.keys(m).sort().join(',')))"
```

预期导出至少包含：

```text
CesiumPlus,create,definePlugin
```

## 真实发布

所有检查通过后再发布：

```sh
npm publish --access public
```

发布后验证：

```sh
npm view cesium-plus version dist-tags --json
npm install cesium-plus cesium
```

如果 npm 账号启用了双因素认证，按 npm 提示输入 OTP。不要关闭 2FA 来迁就脚本。

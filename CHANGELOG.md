# Changelog

[中文](./CHANGELOG.zh-CN.md)

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `CesiumPlus.capture`: on-demand canvas screenshot and download helpers.
- `CesiumPlus.coordinates`: mouse-move coordinate watch helpers.
- `CesiumPlus.coordinates.canWatchMouse`: runtime support flag for mouse coordinate
  watching.

### Fixed

- Pending screenshots now remove their `postRender` listener and reject when
  `CesiumPlus.dispose()` runs.

### Removed

- Removed the pre-release `createCesiumPlus(viewer)` factory alias. Use
  `create(viewer)` instead.
- Removed the pre-release `ScreenshotOptions.type` MIME option. Use
  `format: 'png' | 'jpeg' | 'webp'` instead.
- Removed the pre-release `coordinates.isSupported` and
  `coordinates.watch({ onMove })` APIs. Use `coordinates.canWatchMouse` and
  `coordinates.watchMouse(onMove)` instead.

### Changed

- Screenshot helpers now validate `format`, `quality`, and `filename` for plain
  JavaScript callers.
- `coordinates.watchMouse()` now validates runtime callback input for plain
  JavaScript callers.
- `coordinates.watchMouse()` now reports unsupported `pickPosition` scenes with a
  clear error.
- Plugin names now reject leading or trailing whitespace.

## 0.1.0 - TBD

### Added

- `CesiumPlus` class: plugin manager with name-deduplication and reverse-order
  cleanup.
- `create(viewer)`: factory function.
- `definePlugin(plugin)`: runtime validation helper.
- TypeScript type declarations.
- ESM bundle with source maps.
- CI pipeline for Node 20 / 22 / 24.
- Vue 3 + Vite example.

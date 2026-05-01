# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `CesiumPlus.capture`: on-demand canvas screenshot and download helpers.
- `CesiumPlus.coordinates`: mouse-move coordinate watch helpers.
- `CesiumPlus.coordinates.isSupported`: runtime support flag for `pickPosition`.

### Fixed

- Pending screenshots now remove their `postRender` listener and reject when `CesiumPlus.dispose()` runs.

### Changed

- `coordinates.watch()` now validates runtime options for plain JavaScript callers.
- `coordinates.watch()` now reports unsupported `pickPosition` scenes with a clear error.
- Plugin names now reject leading or trailing whitespace.

## 0.1.0 - TBD

### Added

- `CesiumPlus` class: plugin manager with name-deduplication and reverse-order cleanup.
- `create(viewer)` / `createCesiumPlus(viewer)`: factory functions.
- `definePlugin(plugin)`: runtime validation helper.
- TypeScript type declarations.
- ESM bundle with source maps.
- CI pipeline (Node 20 / 22 / 24).
- Vue 3 + Vite example.

# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `coordinateReadout` plugin: mouse-move coordinate readout (longitude, latitude, height).
- `screenshot` plugin: on-demand canvas screenshot via `takeScreenshot()`.

## 0.1.0 - TBD

### Added

- `CesiumPlus` class: plugin manager with name-deduplication and reverse-order cleanup.
- `create(viewer)` / `createCesiumPlus(viewer)`: factory functions.
- `definePlugin(plugin)`: runtime validation helper.
- TypeScript type declarations.
- ESM bundle with source maps.
- CI pipeline (Node 20 / 22 / 24).
- Vue 3 + Vite example.

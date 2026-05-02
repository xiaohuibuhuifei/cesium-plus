# Cesium Plus

[中文](./README.zh-CN.md)

Framework-agnostic enhancement toolkit for CesiumJS.

Cesium Plus does not modify Cesium, replace `Viewer`, or register global side
effects. Your application creates, configures, and destroys the Cesium
`Viewer`; this package binds to that viewer and provides a small built-in
capability surface plus disposable enhancements through a plugin system.

## Install

```sh
npm install cesium-plus cesium
```

`cesium` is a peer dependency. Cesium Plus is compatible with
`cesium >=1.70.0 <2`.

## Quick Start

```ts
import { Viewer } from 'cesium';
import { create } from 'cesium-plus';

const viewer = new Viewer('cesiumContainer');
const plus = create(viewer);

if (plus.coordinates.canWatchMouse) {
  plus.coordinates.watchMouse(({ longitude, latitude, height }) => {
    console.log(`${longitude.toFixed(6)}, ${latitude.toFixed(6)}, ${height.toFixed(1)}m`);
  });
}

// Capture after the next rendered frame.
const dataUrl = await plus.capture.screenshot({ format: 'jpeg', quality: 0.9 });
await plus.capture.downloadScreenshot({ filename: 'map.jpeg', format: 'jpeg' });

plus.dispose();
```

`create(viewer)` only creates the enhancement manager. It does not create,
destroy, or replace the Cesium `Viewer`.

`dispose()` releases installed plugins and built-in listeners. Pending
screenshots are rejected, and coordinate watchers are removed if the caller has
not already cleaned them up.

See [docs/api.md](./docs/api.md) for the full API reference.

## Core Boundaries

- Cesium Plus is a library for CesiumJS enhancements, not an application
  framework or a CesiumJS replacement.
- The host application owns the Cesium `Viewer` lifecycle.
- Cesium Plus does not bundle Cesium static assets. The host application must
  serve Cesium runtime assets.
- Vue, React, and other frameworks belong in host integration code or examples,
  not in the library API.

## Framework Integration

Vue, React, and other frameworks should create the Cesium `Viewer` in their own
lifecycle, pass it to `create(viewer)`, and call `dispose()` on unmount.

## Cesium Static Assets

CesiumJS requires the host application to serve static assets at runtime. This
configuration stays on the application side and is not handled by this package.

Run the built-in Vue 3 + Vite examples site:

```sh
npm run dev:example
```

The examples app is organized as independently routed demos for each public
capability. The home page is an entry gallery with quick filters, and each
detail page uses a fixed layout with a large Cesium stage on the left and a
narrow status/explanation sidebar on the right. Current routes cover quick
start, mouse coordinates, screenshot capture, and basic plugins.

## Scripts

```sh
npm run lint
npm run typecheck
npm run test
npm run test:example
npm run test:full
npm run build
npm run build:example
npm run pack:check
npm run release:check
npm run release:dry-run
```

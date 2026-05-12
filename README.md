# Cesium Plus

[中文](./README.zh-CN.md)

Task-oriented enhancement toolkit for CesiumJS.

Cesium Plus does not replace Cesium, create `Viewer`, or hide native Cesium
objects. Your application creates, configures, and destroys the Cesium
`Viewer`; Cesium Plus binds to that viewer and provides a small set of
high-frequency task APIs for camera, scene, capture, coordinates, and advanced
plugins.

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

plus.camera.setCameraView({
  lng: 116.3913,
  lat: 39.9075,
  alt: 6500,
  pitch: -45,
});

plus.camera.watchCameraChanged((view) => {
  console.log(view.lng, view.lat, view.alt);
});

plus.scene.requestRender();
await plus.scene.afterNextRender();

const dataUrl = await plus.capture.screenshot({
  format: 'jpeg',
  quality: 0.9,
});

if (plus.coordinates.canWatchMouse) {
  plus.coordinates.watchMouse(({ longitude, latitude, height }) => {
    console.log(longitude, latitude, height);
  });
}

console.log(dataUrl);
plus.dispose();
```

`create(viewer)` only creates the enhancement manager. It does not create,
destroy, or replace the Cesium `Viewer`.

`dispose()` releases installed plugins and first-party listeners. Pending
screenshots, scene render waits, and camera flights are rejected; coordinate and
camera watchers are removed if the caller has not already cleaned them up.

See [docs/api.md](./docs/api.md) for the full API reference.

## Core Boundaries

- Cesium Plus is a CesiumJS enhancement library, not an application framework
  or a CesiumJS replacement.
- The host application owns the Cesium `Viewer` lifecycle.
- Cesium Plus keeps `viewer` public as the escape hatch for advanced Cesium
  usage.
- Cesium Plus does not bundle Cesium static assets. The host application must
  serve Cesium runtime assets.
- The repository does not ship a demo app anymore. Keep host integration code
  in your own application or a separate demo repository.

## Framework Integration

Vue, React, and other frameworks should create the Cesium `Viewer` in their own
lifecycle, pass it to `create(viewer)`, and call `dispose()` on unmount.

## Cesium Static Assets

CesiumJS requires the host application to serve static assets at runtime. This
configuration stays on the application side and is not handled by this package.

## Scripts

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:full
npm run pack:check
npm run release:check
npm run release:dry-run
```

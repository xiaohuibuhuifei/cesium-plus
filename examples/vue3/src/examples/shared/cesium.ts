import { Cartesian2, Cartesian3, Color, LabelStyle, Viewer } from 'cesium';
import { create, type CesiumPlus } from 'cesium-plus';

export interface ExampleTarget {
  readonly longitude: number;
  readonly latitude: number;
  readonly height: number;
}

export interface CesiumPlusExampleSession {
  readonly viewer: Viewer;
  readonly plus: CesiumPlus;
  readonly target: ExampleTarget;
  dispose(): void;
}

interface CreateCesiumPlusExampleSessionOptions {
  readonly cameraHeight?: number;
  readonly cameraLatitudeOffset?: number;
  readonly target?: ExampleTarget;
  readonly targetLabel?: string;
}

const defaultTarget: ExampleTarget = Object.freeze({
  height: 1200,
  latitude: 39.9075,
  longitude: 116.3913,
});

export function createCesiumPlusExampleSession(
  element: HTMLDivElement,
  options: CreateCesiumPlusExampleSessionOptions = {},
): CesiumPlusExampleSession {
  if (!element) {
    throw new Error('缺少 Cesium Viewer 容器。');
  }

  const target = options.target ?? defaultTarget;
  element.replaceChildren();

  const viewer = new Viewer(element, {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    timeline: false,
  });

  addReferenceTarget(viewer, target, options.targetLabel ?? 'Cesium Plus Target');
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(
      target.longitude,
      target.latitude - (options.cameraLatitudeOffset ?? 0.04),
      options.cameraHeight ?? 6500,
    ),
    orientation: {
      heading: 0,
      pitch: -0.72,
      roll: 0,
    },
  });

  const plus = create(viewer);
  viewer.scene.requestRender();

  return {
    plus,
    target,
    viewer,
    dispose() {
      disposeCesiumPlusExampleSession(plus, viewer);
    },
  };
}

export function formatTarget(target: ExampleTarget): string {
  return `${target.longitude.toFixed(4)}, ${target.latitude.toFixed(4)}, ${target.height.toFixed(0)} m`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AggregateError) {
    return error.errors.map((item) => getErrorMessage(item)).join(' | ');
  }

  return error instanceof Error ? error.message : String(error);
}

function addReferenceTarget(viewer: Viewer, target: ExampleTarget, targetLabel: string): void {
  viewer.entities.add({
    id: 'cesium-plus-example-target',
    label: {
      backgroundColor: Color.BLACK.withAlpha(0.62),
      fillColor: Color.WHITE,
      font: '14px sans-serif',
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cartesian2(0, -34),
      showBackground: true,
      style: LabelStyle.FILL_AND_OUTLINE,
      text: targetLabel,
    },
    name: targetLabel,
    point: {
      color: Color.LIME,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelSize: 18,
    },
    position: Cartesian3.fromDegrees(target.longitude, target.latitude, target.height),
  });
}

function disposeCesiumPlusExampleSession(plus: CesiumPlus, viewer: Viewer): void {
  const errors: unknown[] = [];

  if (!plus.disposed) {
    try {
      plus.dispose();
    } catch (error) {
      errors.push(error);
    }
  }

  if (!viewer.isDestroyed()) {
    try {
      viewer.destroy();
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, '示例资源释放失败。');
  }
}

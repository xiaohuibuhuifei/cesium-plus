import type { Viewer } from 'cesium';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { create } from '../src/index';

type ChangedListener = () => void;

interface MockCameraHandle {
  readonly cancelFlight: ReturnType<typeof vi.fn>;
  readonly changedListeners: ChangedListener[];
  readonly flyTo: ReturnType<typeof vi.fn>;
  readonly removeChangedListeners: ReturnType<typeof vi.fn>[];
  readonly requestRender: ReturnType<typeof vi.fn>;
  readonly setView: ReturnType<typeof vi.fn>;
  readonly viewer: Viewer;
}

const cesiumMock = vi.hoisted(() => ({
  fromCartesian: vi.fn(),
  fromDegrees: vi.fn((lng: number, lat: number, alt = 0) => ({
    alt,
    lat,
    lng,
  })),
  handlers: [] as unknown[],
  toDegrees: vi.fn((value: number) => value * (180 / Math.PI)),
  toRadians: vi.fn((value: number) => value * (Math.PI / 180)),
}));

vi.mock('cesium', () => ({
  Cartesian3: {
    fromDegrees: cesiumMock.fromDegrees,
  },
  Cartographic: {
    fromCartesian: cesiumMock.fromCartesian,
  },
  Math: {
    toDegrees: cesiumMock.toDegrees,
    toRadians: cesiumMock.toRadians,
  },
  ScreenSpaceEventHandler: vi.fn(),
  ScreenSpaceEventType: {
    MOUSE_MOVE: 'MOUSE_MOVE',
  },
}));

beforeEach(() => {
  cesiumMock.fromCartesian.mockReset();
  cesiumMock.fromDegrees.mockClear();
  cesiumMock.toDegrees.mockClear();
  cesiumMock.toRadians.mockClear();
});

describe('camera', () => {
  it('读取当前相机视角并转换为角度值', () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    expect(plus.camera.getCameraView()).toMatchObject({
      alt: 1200,
      heading: expect.closeTo(45, 10),
      lat: expect.closeTo(40, 10),
      lng: expect.closeTo(120, 10),
      pitch: expect.closeTo(-30, 10),
      roll: expect.closeTo(5, 10),
    });
  });

  it('设置相机视角并显式请求渲染', () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    plus.camera.setCameraView({
      alt: 1500,
      heading: 90,
      lat: 31,
      lng: 121,
      pitch: -45,
      roll: 0,
    });

    expect(cesiumMock.fromDegrees).toHaveBeenCalledWith(121, 31, 1500);
    expect(handle.setView).toHaveBeenCalledWith({
      destination: {
        alt: 1500,
        lat: 31,
        lng: 121,
      },
      orientation: {
        heading: 90 * (Math.PI / 180),
        pitch: -45 * (Math.PI / 180),
        roll: 0,
      },
    });
    expect(handle.requestRender).toHaveBeenCalledTimes(1);
  });

  it('飞行到点位并复用普通对象输入', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    const flight = plus.camera.flyToPoint(
      {
        lat: 30,
        lng: 120,
      },
      {
        alt: 2200,
        duration: 2.5,
        heading: 180,
        pitch: -35,
      },
    );
    const options = handle.flyTo.mock.calls[0]?.[0] as
      | {
          cancel?: () => void;
          complete?: () => void;
          destination: unknown;
          duration?: number;
          orientation?: unknown;
        }
      | undefined;

    expect(options).toEqual({
      cancel: expect.any(Function),
      complete: expect.any(Function),
      destination: {
        alt: 2200,
        lat: 30,
        lng: 120,
      },
      duration: 2.5,
      orientation: {
        heading: 180 * (Math.PI / 180),
        pitch: -35 * (Math.PI / 180),
      },
    });

    options?.complete?.();
    await expect(flight).resolves.toBeUndefined();
  });

  it('取消飞行时拒绝等待中的 Promise', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    const flight = plus.camera.flyToPoint({
      lat: 30,
      lng: 120,
    });
    plus.camera.cancelFlight();

    await expect(flight).rejects.toThrow('已被取消');
    expect(handle.cancelFlight).toHaveBeenCalledTimes(1);
    expect(handle.requestRender).toHaveBeenCalledTimes(1);
  });

  it('监听相机变化并返回幂等清理函数', () => {
    const handle = mockViewer();
    const onChange = vi.fn();
    const plus = create(handle.viewer);

    const cleanup = plus.camera.watchCameraChanged(onChange);
    updateCameraView(handle.viewer, {
      alt: 3000,
      heading: 90,
      lat: 20,
      lng: 100,
      pitch: -15,
      roll: 10,
    });
    handle.changedListeners[0]?.();
    cleanup();
    cleanup();

    expect(onChange).toHaveBeenCalledWith({
      alt: 3000,
      heading: expect.closeTo(90, 10),
      lat: expect.closeTo(20, 10),
      lng: expect.closeTo(100, 10),
      pitch: expect.closeTo(-15, 10),
      roll: expect.closeTo(10, 10),
    });
    expect(handle.removeChangedListeners[0]).toHaveBeenCalledTimes(1);
  });

  it('释放时拒绝等待中的飞行 Promise 并清理监听', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    plus.camera.watchCameraChanged(vi.fn());
    const flight = plus.camera.flyToPoint({
      lat: 30,
      lng: 120,
    });
    plus.dispose();

    await expect(flight).rejects.toThrow('CesiumPlus 已经释放。');
    expect(handle.cancelFlight).toHaveBeenCalledTimes(1);
    expect(handle.removeChangedListeners[0]).toHaveBeenCalledTimes(1);
  });

  it('运行时校验相机参数与回调', async () => {
    const plus = create(mockViewer().viewer);

    expect(() =>
      plus.camera.setCameraView({
        alt: Number.NaN,
        lat: 31,
        lng: 121,
      } as never),
    ).toThrow('alt');
    await expect(plus.camera.flyToPoint(null as never)).rejects.toThrow('point 对象');
    await expect(
      plus.camera.flyToPoint(
        {
          lat: 30,
          lng: 120,
        },
        {
          duration: -1,
        },
      ),
    ).rejects.toThrow('duration');
    expect(() => plus.camera.watchCameraChanged(null as never)).toThrow('callback 函数');
  });
});

function mockViewer(): MockCameraHandle {
  const changedListeners: ChangedListener[] = [];
  const removeChangedListeners: ReturnType<typeof vi.fn>[] = [];
  const requestRender = vi.fn();
  const cancelFlight = vi.fn();
  const flyTo = vi.fn();
  const setView = vi.fn();

  const camera = {
    changed: {
      addEventListener: vi.fn((listener: ChangedListener) => {
        changedListeners.push(listener);
        const removeListener = vi.fn();
        removeChangedListeners.push(removeListener);
        return removeListener;
      }),
    },
    cancelFlight,
    flyTo,
    heading: Math.PI / 4,
    pitch: -Math.PI / 6,
    positionCartographic: {
      height: 1200,
      latitude: 40 * (Math.PI / 180),
      longitude: 120 * (Math.PI / 180),
    },
    roll: 5 * (Math.PI / 180),
    setView,
  };

  const viewer = {
    camera,
    scene: {
      requestRender,
    },
  } as unknown as Viewer;

  return {
    cancelFlight,
    changedListeners,
    flyTo,
    removeChangedListeners,
    requestRender,
    setView,
    viewer,
  };
}

function updateCameraView(
  viewer: Viewer,
  view: {
    alt: number;
    heading: number;
    lat: number;
    lng: number;
    pitch: number;
    roll: number;
  },
): void {
  const camera = (
    viewer as {
      camera: {
        heading: number;
        pitch: number;
        positionCartographic: {
          height: number;
          latitude: number;
          longitude: number;
        };
        roll: number;
      };
    }
  ).camera;

  camera.heading = view.heading * (Math.PI / 180);
  camera.pitch = view.pitch * (Math.PI / 180);
  camera.positionCartographic.height = view.alt;
  camera.positionCartographic.latitude = view.lat * (Math.PI / 180);
  camera.positionCartographic.longitude = view.lng * (Math.PI / 180);
  camera.roll = view.roll * (Math.PI / 180);
}

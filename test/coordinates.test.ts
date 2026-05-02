import type { Cartesian2, Viewer } from 'cesium';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { create, definePlugin } from '../src/index';

type MoveCallback = (movement: { endPosition: unknown }) => void;

interface MockViewerOptions {
  readonly hasPickPosition?: boolean;
  readonly pickPositionSupported?: boolean;
}

interface MockHandler {
  callback: MoveCallback | undefined;
  destroyed: boolean;
  destroy: ReturnType<typeof vi.fn>;
  isDestroyed: ReturnType<typeof vi.fn>;
  setInputAction: ReturnType<typeof vi.fn>;
  type: unknown;
}

const cesiumMock = vi.hoisted(() => {
  const handlers: MockHandler[] = [];

  const ScreenSpaceEventHandler = vi.fn(function (this: unknown) {
    const handler: MockHandler = {
      callback: undefined,
      destroyed: false,
      destroy: vi.fn(),
      isDestroyed: vi.fn(),
      setInputAction: vi.fn(),
      type: undefined,
    };

    handler.destroy.mockImplementation(() => {
      handler.destroyed = true;
    });
    handler.isDestroyed.mockImplementation(() => handler.destroyed);
    handler.setInputAction.mockImplementation((callback: MoveCallback, type: unknown) => {
      handler.callback = callback;
      handler.type = type;
    });
    handlers.push(handler);
    return handler;
  });

  return {
    ScreenSpaceEventHandler,
    fromCartesian: vi.fn(),
    handlers,
    toDegrees: vi.fn((value: number) => value * (180 / Math.PI)),
  };
});

vi.mock('cesium', () => ({
  Cartographic: {
    fromCartesian: cesiumMock.fromCartesian,
  },
  Math: {
    toDegrees: cesiumMock.toDegrees,
  },
  ScreenSpaceEventHandler: cesiumMock.ScreenSpaceEventHandler,
  ScreenSpaceEventType: { MOUSE_MOVE: 'MOUSE_MOVE' },
}));

beforeEach(() => {
  cesiumMock.handlers.length = 0;
  cesiumMock.ScreenSpaceEventHandler.mockClear();
  cesiumMock.fromCartesian.mockReset();
  cesiumMock.fromCartesian.mockReturnValue({
    height: 100,
    latitude: 0.5,
    longitude: 2.0,
  });
  cesiumMock.toDegrees.mockClear();
});

describe('coordinates', () => {
  it('暴露 pickPosition 支持状态', () => {
    expect(create(mockViewer()).coordinates.canWatchMouse).toBe(true);
    expect(
      create(
        mockViewer(undefined, {
          pickPositionSupported: false,
        }),
      ).coordinates.canWatchMouse,
    ).toBe(false);
    expect(
      create(
        mockViewer(undefined, {
          hasPickPosition: false,
        }),
      ).coordinates.canWatchMouse,
    ).toBe(false);
  });

  it('注册鼠标移动坐标监听', () => {
    const viewer = mockViewer();
    const plus = create(viewer);

    const cleanup = plus.coordinates.watchMouse(vi.fn());
    const handler = firstHandler();

    expect(cesiumMock.ScreenSpaceEventHandler).toHaveBeenCalledWith(viewer.scene.canvas);
    expect(handler.setInputAction).toHaveBeenCalledWith(expect.any(Function), 'MOUSE_MOVE');
    expect(typeof cleanup).toBe('function');
  });

  it('鼠标移动时输出经纬高', () => {
    const endPosition = {} as Cartesian2;
    const viewer = mockViewer({ x: 1, y: 2, z: 3 });
    const onMove = vi.fn();
    const plus = create(viewer);

    plus.coordinates.watchMouse(onMove);
    triggerMove(endPosition);

    expect(viewer.scene.pickPosition).toHaveBeenCalledWith(endPosition);
    expect(cesiumMock.fromCartesian).toHaveBeenCalledWith({ x: 1, y: 2, z: 3 });
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove.mock.calls[0]?.[0]).toEqual({
      height: 100,
      latitude: 0.5 * (180 / Math.PI),
      longitude: 2.0 * (180 / Math.PI),
    });
  });

  it('pickPosition 没有结果时不触发 onMove', () => {
    const viewer = mockViewer(undefined);
    const onMove = vi.fn();
    const plus = create(viewer);

    plus.coordinates.watchMouse(onMove);
    triggerMove({} as Cartesian2);

    expect(onMove).not.toHaveBeenCalled();
    expect(cesiumMock.fromCartesian).not.toHaveBeenCalled();
  });

  it('Cartographic 转换没有结果时不触发 onMove', () => {
    cesiumMock.fromCartesian.mockReturnValueOnce(undefined);
    const viewer = mockViewer({ x: 1, y: 2, z: 3 });
    const onMove = vi.fn();
    const plus = create(viewer);

    plus.coordinates.watchMouse(onMove);
    triggerMove({} as Cartesian2);

    expect(onMove).not.toHaveBeenCalled();
  });

  it('Scene 不支持 pickPosition 时拒绝监听坐标', () => {
    const plus = create(
      mockViewer(undefined, {
        pickPositionSupported: false,
      }),
    );

    expect(() => plus.coordinates.watchMouse(vi.fn())).toThrow('pickPosition');
    expect(cesiumMock.ScreenSpaceEventHandler).not.toHaveBeenCalled();
  });

  it('cleanup 幂等释放监听', () => {
    const plus = create(mockViewer());
    const cleanup = plus.coordinates.watchMouse(vi.fn());
    const handler = firstHandler();

    cleanup();
    cleanup();

    expect(handler.destroy).toHaveBeenCalledTimes(1);
  });

  it('dispose 释放未手动清理的监听并保持插件先释放', () => {
    const calls: string[] = [];
    const plus = create(mockViewer());

    plus.coordinates.watchMouse(vi.fn());
    firstHandler().destroy.mockImplementationOnce(() => {
      firstHandler().destroyed = true;
      calls.push('coordinates');
    });
    plus.use(
      definePlugin({
        name: 'sample',
        install: () => () => calls.push('plugin'),
      }),
    );

    plus.dispose();

    expect(calls).toEqual(['plugin', 'coordinates']);
  });

  it('坐标监听不进入插件列表', () => {
    const plus = create(mockViewer());

    plus.coordinates.watchMouse(vi.fn());

    expect(plus.pluginNames).toEqual([]);
  });

  it('释放后拒绝继续监听坐标', () => {
    const plus = create(mockViewer());
    plus.dispose();

    expect(() => plus.coordinates.watchMouse(vi.fn())).toThrow('CesiumPlus 已经释放。');
  });

  it('运行时校验监听 callback', () => {
    const plus = create(mockViewer());

    expect(() => plus.coordinates.watchMouse(null as never)).toThrow('callback 函数');
    expect(() => plus.coordinates.watchMouse('bad' as never)).toThrow('callback 函数');
  });
});

function mockViewer(position?: unknown, options: MockViewerOptions = {}): Viewer {
  const scene: {
    canvas: object;
    pickPosition?: ReturnType<typeof vi.fn>;
    pickPositionSupported?: boolean;
  } = {
    canvas: {},
  };

  if (options.hasPickPosition !== false) {
    scene.pickPosition = vi.fn(() => position);
  }

  if (options.pickPositionSupported !== undefined) {
    scene.pickPositionSupported = options.pickPositionSupported;
  }

  return {
    scene,
  } as unknown as Viewer;
}

function firstHandler(): (typeof cesiumMock.handlers)[number] {
  const handler = cesiumMock.handlers[0];

  if (!handler) {
    throw new Error('缺少 ScreenSpaceEventHandler。');
  }

  return handler;
}

function triggerMove(endPosition: Cartesian2): void {
  const callback = firstHandler().callback;

  if (!callback) {
    throw new Error('缺少 MOUSE_MOVE 回调。');
  }

  callback({ endPosition });
}

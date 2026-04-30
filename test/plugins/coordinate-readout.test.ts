import type { Viewer } from 'cesium';
import { describe, expect, it, vi } from 'vitest';

import { createCesiumPlus } from '../../src/index';
import { coordinateReadout } from '../../src/plugins/coordinate-readout';

const handlerInstance = {
  setInputAction: vi.fn(),
  destroy: vi.fn(),
  isDestroyed: vi.fn(() => false),
};

vi.mock('cesium', () => ({
  ScreenSpaceEventHandler: vi.fn(function (this: unknown) {
    return handlerInstance;
  }),
  ScreenSpaceEventType: { MOUSE_MOVE: 'MOUSE_MOVE' },
  Cartographic: {
    fromCartesian: vi.fn(() => ({
      longitude: 2.0,
      latitude: 0.5,
      height: 100,
    })),
  },
  Math: { toDegrees: vi.fn((v: number) => v * (180 / Math.PI)) },
}));

function mockViewer(): Viewer {
  return {
    scene: {
      canvas: {} as HTMLElement,
      pickPosition: vi.fn(),
    },
  } as unknown as Viewer;
}

describe('coordinateReadout', () => {
  it('导出正确名称', () => {
    const plugin = coordinateReadout({ onMove: vi.fn() });
    expect(plugin.name).toBe('coordinate-readout');
    expect(typeof plugin.install).toBe('function');
  });

  it('install 返回 cleanup 函数', () => {
    const viewer = mockViewer();
    const plugin = coordinateReadout({ onMove: vi.fn() });
    const cleanup = plugin.install({ viewer, plus: {} as never });
    expect(typeof cleanup).toBe('function');
  });

  it('cleanup 调用 handler.destroy()', () => {
    const viewer = mockViewer();
    const plugin = coordinateReadout({ onMove: vi.fn() });
    const cleanup = plugin.install({ viewer, plus: {} as never });
    handlerInstance.destroy.mockClear();
    cleanup!();
    expect(handlerInstance.destroy).toHaveBeenCalled();
  });

  it('能注册到 CesiumPlus', () => {
    const viewer = mockViewer();
    const plus = createCesiumPlus(viewer);
    plus.use(coordinateReadout({ onMove: vi.fn() }));
    expect(plus.pluginNames).toEqual(['coordinate-readout']);
  });

  it('同名插件只安装一次', () => {
    const viewer = mockViewer();
    const plus = createCesiumPlus(viewer);
    plus
      .use(coordinateReadout({ onMove: vi.fn() }))
      .use(coordinateReadout({ onMove: vi.fn() }));
    expect(plus.pluginNames).toEqual(['coordinate-readout']);
  });
});

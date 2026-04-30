import { describe, expect, it, vi } from 'vitest';

import { createCesiumPlus } from '../../src/index';
import { screenshot } from '../../src/plugins/screenshot';

describe('screenshot', () => {
  it('安装后 takeScreenshot 返回 canvas toDataURL 结果', () => {
    const dataUrl = 'data:image/png;base64,abc123';
    const viewer = {
      scene: {
        canvas: {
          toDataURL: vi.fn(() => dataUrl),
        },
      },
    } as unknown as import('cesium').Viewer;

    const plugin = screenshot();
    const plus = createCesiumPlus(viewer);
    plus.use(plugin);

    expect(plugin.takeScreenshot()).toBe(dataUrl);
    expect((viewer.scene.canvas as unknown as { toDataURL: ReturnType<typeof vi.fn> }).toDataURL).toHaveBeenCalledWith('image/png');
  });

  it('安装前调用 takeScreenshot 抛错', () => {
    const plugin = screenshot();
    expect(() => plugin.takeScreenshot()).toThrow('screenshot 插件尚未安装');
  });

  it('同名插件只安装一次', () => {
    const viewer = {
      scene: { canvas: { toDataURL: vi.fn(() => '') } },
    } as unknown as import('cesium').Viewer;

    const plus = createCesiumPlus(viewer);
    plus.use(screenshot()).use(screenshot());

    expect(plus.pluginNames).toEqual(['screenshot']);
  });
});

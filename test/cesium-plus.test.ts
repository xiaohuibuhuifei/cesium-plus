import type { Viewer } from 'cesium';
import { describe, expect, it, vi } from 'vitest';

import { CesiumPlus, create, definePlugin } from '../src/index';

const viewer = {} as Viewer;

describe('CesiumPlus', () => {
  it('拒绝 null / undefined viewer', () => {
    expect(() => new CesiumPlus(null as never)).toThrow(TypeError);
    expect(() => new CesiumPlus(undefined as never)).toThrow(TypeError);
  });

  it('保留调用方创建的 Viewer', () => {
    const plus = create(viewer);

    expect(plus.viewer).toBe(viewer);
    expect(plus.disposed).toBe(false);
    expect(typeof plus.camera.getCameraView).toBe('function');
    expect(typeof plus.scene.requestRender).toBe('function');
  });

  it('通过 create 创建增强管理器', () => {
    const plus = create(viewer);

    expect(plus.viewer).toBe(viewer);
  });

  it('按插件名去重安装', () => {
    const install = vi.fn();
    const plus = create(viewer);
    const plugin = definePlugin({
      name: 'sample',
      install,
    });

    plus.use(plugin).use(plugin);

    expect(install).toHaveBeenCalledTimes(1);
    expect(plus.pluginNames).toEqual(['sample']);
  });

  it('按安装顺序反向执行释放回调', () => {
    const calls: string[] = [];
    const plus = create(viewer);

    plus
      .use(
        definePlugin({
          name: 'first',
          install: () => () => calls.push('first'),
        }),
      )
      .use(
        definePlugin({
          name: 'second',
          install: () => () => calls.push('second'),
        }),
      );

    plus.dispose();
    plus.dispose();

    expect(calls).toEqual(['second', 'first']);
    expect(plus.disposed).toBe(true);
    expect(plus.pluginNames).toEqual([]);
  });

  it('释放后拒绝继续安装插件', () => {
    const plus = create(viewer);
    plus.dispose();

    expect(() =>
      plus.use(
        definePlugin({
          name: 'late',
          install: () => undefined,
        }),
      ),
    ).toThrow('CesiumPlus 已经释放。');
  });

  it('运行时校验插件结构', () => {
    expect(() =>
      definePlugin({
        name: '',
        install: () => undefined,
      }),
    ).toThrow('非空名称');

    expect(() =>
      definePlugin({
        name: ' bad ',
        install: () => undefined,
      }),
    ).toThrow('首尾空白');

    expect(() =>
      definePlugin({
        name: 'bad',
        install: 'nope',
      } as never),
    ).toThrow('install 函数');
  });

  it('释放失败时仍执行剩余释放回调', () => {
    const calls: string[] = [];
    const plus = create(viewer);

    plus
      .use(
        definePlugin({
          name: 'broken',
          install: () => () => {
            calls.push('broken');
            throw new Error('释放失败');
          },
        }),
      )
      .use(
        definePlugin({
          name: 'stable',
          install: () => () => calls.push('stable'),
        }),
      );

    expect(() => plus.dispose()).toThrow(AggregateError);
    expect(calls).toEqual(['stable', 'broken']);
  });
});

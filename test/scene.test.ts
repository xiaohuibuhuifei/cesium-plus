import type { Viewer } from 'cesium';
import { describe, expect, it, vi } from 'vitest';

import { create } from '../src/index';

interface MockSceneHandle {
  readonly listenerRemovers: ReturnType<typeof vi.fn>[];
  readonly postRenderListeners: Array<() => void>;
  readonly requestRender: ReturnType<typeof vi.fn>;
  readonly viewer: Viewer;
}

describe('scene', () => {
  it('显式请求渲染当前场景', () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    plus.scene.requestRender();

    expect(handle.requestRender).toHaveBeenCalledTimes(1);
  });

  it('等待下一次渲染完成后 resolve', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    const waiting = plus.scene.afterNextRender();
    emitNextPostRender(handle);

    await expect(waiting).resolves.toBeUndefined();
    expect(handle.requestRender).toHaveBeenCalledTimes(1);
    expect(handle.listenerRemovers[0]).toHaveBeenCalledTimes(1);
  });

  it('释放时移除等待中的渲染监听并拒绝 Promise', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    const waiting = plus.scene.afterNextRender();
    plus.dispose();

    await expect(waiting).rejects.toThrow('CesiumPlus 已经释放。');
    expect(handle.listenerRemovers[0]).toHaveBeenCalledTimes(1);
  });

  it('运行时校验场景形状', async () => {
    const plus = create({} as Viewer);

    expect(() => plus.scene.requestRender()).toThrow('Cesium Scene');
    await expect(plus.scene.afterNextRender()).rejects.toThrow('Cesium Scene');
  });
});

function mockViewer(): MockSceneHandle {
  const postRenderListeners: Array<() => void> = [];
  const listenerRemovers: ReturnType<typeof vi.fn>[] = [];
  const requestRender = vi.fn();

  const viewer = {
    scene: {
      postRender: {
        addEventListener: vi.fn((listener: () => void) => {
          postRenderListeners.push(listener);
          const removeListener = vi.fn();
          listenerRemovers.push(removeListener);
          return removeListener;
        }),
      },
      requestRender,
    },
  } as unknown as Viewer;

  return {
    listenerRemovers,
    postRenderListeners,
    requestRender,
    viewer,
  };
}

function emitNextPostRender(handle: MockSceneHandle): void {
  const listener = handle.postRenderListeners.shift();

  if (!listener) {
    throw new Error('缺少 postRender listener。');
  }

  listener();
}

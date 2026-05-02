import type { Viewer } from 'cesium';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { create } from '../src/index';

interface MockViewerHandle {
  readonly listenerRemovers: ReturnType<typeof vi.fn>[];
  readonly postRenderListeners: Array<() => void>;
  readonly requestRender: ReturnType<typeof vi.fn>;
  readonly toDataURL: ReturnType<typeof vi.fn>;
  readonly viewer: Viewer;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('capture', () => {
  it('在下一次 postRender 后生成 PNG data URL', async () => {
    const handle = mockViewer('data:image/png;base64,abc123');
    const plus = create(handle.viewer);

    const screenshot = plus.capture.screenshot();
    emitNextPostRender(handle);

    await expect(screenshot).resolves.toBe('data:image/png;base64,abc123');
    expect(handle.requestRender).toHaveBeenCalledTimes(1);
    expect(handle.toDataURL).toHaveBeenCalledWith('image/png');
    expect(handle.listenerRemovers[0]).toHaveBeenCalledTimes(1);
  });

  it('把自定义格式和质量传给 canvas', async () => {
    const handle = mockViewer('data:image/jpeg;base64,abc123');
    const plus = create(handle.viewer);

    const screenshot = plus.capture.screenshot({
      format: 'jpeg',
      quality: 0.8,
    });
    emitNextPostRender(handle);

    await expect(screenshot).resolves.toBe('data:image/jpeg;base64,abc123');
    expect(handle.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);
  });

  it('下载截图并返回同一个 data URL', async () => {
    const handle = mockViewer('data:image/jpeg;base64,download');
    const link = mockDocument();
    const plus = create(handle.viewer);

    const screenshot = plus.capture.downloadScreenshot({
      filename: 'map.jpeg',
      format: 'jpeg',
    });
    emitNextPostRender(handle);

    await expect(screenshot).resolves.toBe('data:image/jpeg;base64,download');
    expect(handle.toDataURL).toHaveBeenCalledWith('image/jpeg');
    expect(link.href).toBe('data:image/jpeg;base64,download');
    expect(link.download).toBe('map.jpeg');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(link.remove).toHaveBeenCalledTimes(1);
  });

  it('下载截图时默认文件名跟随格式', async () => {
    const handle = mockViewer('data:image/webp;base64,download');
    const link = mockDocument();
    const plus = create(handle.viewer);

    const screenshot = plus.capture.downloadScreenshot({ format: 'webp' });
    emitNextPostRender(handle);

    await expect(screenshot).resolves.toBe('data:image/webp;base64,download');
    expect(handle.toDataURL).toHaveBeenCalledWith('image/webp');
    expect(link.download).toBe('cesium-plus-screenshot.webp');
  });

  it('释放后拒绝截图', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);
    plus.dispose();

    await expect(plus.capture.screenshot()).rejects.toThrow('CesiumPlus 已经释放。');
  });

  it('释放时移除等待中的 postRender 监听并拒绝截图', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    const screenshot = plus.capture.screenshot();
    plus.dispose();

    await expect(screenshot).rejects.toThrow('CesiumPlus 已经释放。');
    expect(handle.listenerRemovers[0]).toHaveBeenCalledTimes(1);
  });

  it('运行时校验截图选项', async () => {
    const handle = mockViewer();
    const plus = create(handle.viewer);

    await expect(plus.capture.screenshot(null as never)).rejects.toThrow('options 对象');
    await expect(
      plus.capture.screenshot({
        format: 'gif',
      } as never),
    ).rejects.toThrow('png、jpeg 或 webp');
    await expect(
      plus.capture.screenshot({
        quality: 2,
      }),
    ).rejects.toThrow('0 到 1');
    await expect(
      plus.capture.downloadScreenshot({
        filename: '',
      }),
    ).rejects.toThrow('filename');
  });
});

function mockViewer(dataUrl = 'data:image/png;base64,abc123'): MockViewerHandle {
  const postRenderListeners: Array<() => void> = [];
  const listenerRemovers: ReturnType<typeof vi.fn>[] = [];
  const requestRender = vi.fn();
  const toDataURL = vi.fn(() => dataUrl);

  const viewer = {
    scene: {
      canvas: {
        toDataURL,
      },
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
    toDataURL,
    viewer,
  };
}

function emitNextPostRender(handle: MockViewerHandle): void {
  const listener = handle.postRenderListeners.shift();

  if (!listener) {
    throw new Error('缺少 postRender listener。');
  }

  listener();
}

function mockDocument(): {
  click: ReturnType<typeof vi.fn>;
  download: string;
  href: string;
  remove: ReturnType<typeof vi.fn>;
} {
  const link = {
    click: vi.fn(),
    download: '',
    href: '',
    remove: vi.fn(),
  };
  const documentMock = {
    body: {
      append: vi.fn(),
    },
    createElement: vi.fn(() => link),
  };

  vi.stubGlobal('document', documentMock);
  return link;
}

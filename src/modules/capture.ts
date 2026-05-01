import type { Viewer } from 'cesium';

const defaultScreenshotType = 'image/png';
const defaultScreenshotFilename = 'cesium-plus-screenshot.png';
const disposedErrorMessage = 'CesiumPlus 已经释放。';

type RemoveListener = () => void;

interface PendingRenderWait {
  readonly reject: (error: unknown) => void;
  removeListener: RemoveListener;
}

export interface ScreenshotOptions {
  /** 输出图片类型，默认使用 PNG */
  readonly type?: string;
  /** 图片质量，语义与 canvas.toDataURL 的第二个参数一致 */
  readonly quality?: number;
}

export interface DownloadScreenshotOptions extends ScreenshotOptions {
  /** 下载文件名，默认使用 cesium-plus-screenshot.png */
  readonly filename?: string;
}

/**
 * Cesium Plus 内置画布捕获能力。
 *
 * 截图会请求下一帧渲染，并在 Cesium `postRender` 后读取 canvas。
 */
export interface CesiumPlusCapture {
  /**
   * 请求下一帧渲染后读取 canvas，返回截图 data URL。
   *
   * `type` 默认是 `image/png`。实例释放后调用会抛出错误。
   *
   * @throws Error 当 Cesium Plus 已释放或 Cesium 请求渲染失败时拒绝。
   */
  screenshot(options?: ScreenshotOptions): Promise<string>;
  /**
   * 复用截图流程并触发浏览器下载，返回同一个 data URL。
   *
   * 需要浏览器 `document`；默认文件名是 `cesium-plus-screenshot.png`。
   *
   * @throws Error 当 Cesium Plus 已释放、缺少浏览器 `document` 或截图失败时拒绝。
   */
  downloadScreenshot(options?: DownloadScreenshotOptions): Promise<string>;
}

interface CaptureControllerApi extends CesiumPlusCapture {
  dispose(): void;
}

export function createCapture(viewer: Viewer, assertActive: () => void): CaptureControllerApi {
  return new CaptureController(viewer, assertActive);
}

class CaptureController implements CaptureControllerApi {
  readonly #pendingRenderWaits = new Set<PendingRenderWait>();

  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
  ) {}

  public async screenshot(options: ScreenshotOptions = {}): Promise<string> {
    this.assertActive();
    await this.waitForNextRender();
    this.assertActive();
    return readCanvasDataUrl(this.viewer, options);
  }

  public async downloadScreenshot(options: DownloadScreenshotOptions = {}): Promise<string> {
    this.assertActive();

    if (typeof document === 'undefined') {
      throw new Error('downloadScreenshot 需要浏览器 document。');
    }

    const dataUrl = await this.screenshot(options);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = options.filename ?? defaultScreenshotFilename;
    document.body.append(link);
    link.click();
    link.remove();
    return dataUrl;
  }

  public dispose(): void {
    const errors: unknown[] = [];

    for (const pending of [...this.#pendingRenderWaits]) {
      this.#pendingRenderWaits.delete(pending);

      try {
        pending.removeListener();
      } catch (error) {
        errors.push(error);
      }

      pending.reject(new Error(disposedErrorMessage));
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, '一个或多个截图监听释放失败。');
    }
  }

  private waitForNextRender(): Promise<void> {
    return new Promise((resolve, reject) => {
      const scene = this.viewer.scene;

      const pending: PendingRenderWait = {
        reject,
        removeListener: () => undefined,
      };

      const finish = () => {
        if (!this.#pendingRenderWaits.delete(pending)) {
          return;
        }

        try {
          pending.removeListener();
        } catch (error) {
          reject(error);
          return;
        }

        resolve();
      };

      pending.removeListener = scene.postRender.addEventListener(finish);
      this.#pendingRenderWaits.add(pending);

      try {
        scene.requestRender();
      } catch (error) {
        this.#pendingRenderWaits.delete(pending);
        pending.removeListener();
        reject(error);
      }
    });
  }
}

function readCanvasDataUrl(viewer: Viewer, options: ScreenshotOptions): string {
  const canvas = viewer.scene.canvas as HTMLCanvasElement;
  const type = options.type ?? defaultScreenshotType;

  if (options.quality === undefined) {
    return canvas.toDataURL(type);
  }

  return canvas.toDataURL(type, options.quality);
}

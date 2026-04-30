import type { Viewer } from 'cesium';

const defaultScreenshotType = 'image/png';
const defaultScreenshotFilename = 'cesium-plus-screenshot.png';

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

export interface CesiumPlusCapture {
  /**
   * screenshot
   *
   * @param options 截图输出选项
   * @returns 截图生成的 data URL
   */
  screenshot(options?: ScreenshotOptions): Promise<string>;
  /**
   * downloadScreenshot
   *
   * @param options 截图输出和下载选项
   * @returns 截图生成的 data URL
   */
  downloadScreenshot(options?: DownloadScreenshotOptions): Promise<string>;
}

/**
 * createCapture
 *
 * @param viewer Cesium Viewer 实例
 * @param assertActive CesiumPlus 生命周期校验函数
 * @returns CesiumPlus 内置画布捕获能力
 */
export function createCapture(
  viewer: Viewer,
  assertActive: () => void,
): CesiumPlusCapture {
  return new CaptureController(viewer, assertActive);
}

class CaptureController implements CesiumPlusCapture {
  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
  ) {}

  /**
   * screenshot
   *
   * @param options 截图输出选项
   * @returns 截图生成的 data URL
   */
  public async screenshot(options: ScreenshotOptions = {}): Promise<string> {
    this.assertActive();
    await this.waitForNextRender();
    this.assertActive();
    return readCanvasDataUrl(this.viewer, options);
  }

  /**
   * downloadScreenshot
   *
   * @param options 截图输出和下载选项
   * @returns 截图生成的 data URL
   */
  public async downloadScreenshot(
    options: DownloadScreenshotOptions = {},
  ): Promise<string> {
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

  /**
   * waitForNextRender
   *
   * @returns 下一次 scene postRender 完成后的 Promise
   */
  private waitForNextRender(): Promise<void> {
    return new Promise((resolve, reject) => {
      const scene = this.viewer.scene;
      const removeListener = scene.postRender.addEventListener(() => {
        removeListener();
        resolve();
      });

      try {
        scene.requestRender();
      } catch (error) {
        removeListener();
        reject(error);
      }
    });
  }
}

/**
 * readCanvasDataUrl
 *
 * @param viewer Cesium Viewer 实例
 * @param options 截图输出选项
 * @returns canvas 当前内容的 data URL
 */
function readCanvasDataUrl(viewer: Viewer, options: ScreenshotOptions): string {
  const canvas = viewer.scene.canvas as HTMLCanvasElement;
  const type = options.type ?? defaultScreenshotType;

  if (options.quality === undefined) {
    return canvas.toDataURL(type);
  }

  return canvas.toDataURL(type, options.quality);
}

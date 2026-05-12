import type { Viewer } from 'cesium';

const defaultScreenshotFormat = 'png';

export type ScreenshotFormat = 'png' | 'jpeg' | 'webp';

interface ScreenshotFormatDefinition {
  readonly extension: string;
  readonly mimeType: string;
}

const screenshotFormats: Record<ScreenshotFormat, ScreenshotFormatDefinition> = {
  jpeg: {
    extension: 'jpeg',
    mimeType: 'image/jpeg',
  },
  png: {
    extension: 'png',
    mimeType: 'image/png',
  },
  webp: {
    extension: 'webp',
    mimeType: 'image/webp',
  },
} as const;

export interface ScreenshotOptions {
  /** 输出图片格式，默认使用 png。 */
  readonly format?: ScreenshotFormat;
  /** 图片质量，取值范围为 0 到 1。 */
  readonly quality?: number;
}

export interface DownloadScreenshotOptions extends ScreenshotOptions {
  /** 下载文件名，默认随图片格式生成。 */
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
   * `format` 默认是 `png`。实例释放后调用会抛出错误。
   *
   * @throws TypeError 当 options、format 或 quality 无效时拒绝。
   * @throws Error 当 Cesium Plus 已释放或 Cesium 请求渲染失败时拒绝。
   */
  screenshot(options?: ScreenshotOptions): Promise<string>;
  /**
   * 复用截图流程并触发浏览器下载，返回同一个 data URL。
   *
   * 需要浏览器 `document`；默认文件名随图片格式生成。
   *
   * @throws TypeError 当 options、format、quality 或 filename 无效时拒绝。
   * @throws Error 当 Cesium Plus 已释放、缺少浏览器 `document` 或截图失败时拒绝。
   */
  downloadScreenshot(options?: DownloadScreenshotOptions): Promise<string>;
}

interface CaptureControllerApi extends CesiumPlusCapture {
  dispose(): void;
}

interface CanvasLike {
  toDataURL(type?: string, quality?: number): string;
}

export function createCapture(
  viewer: Viewer,
  assertActive: () => void,
  afterNextRender: () => Promise<void>,
): CaptureControllerApi {
  return new CaptureController(viewer, assertActive, afterNextRender);
}

class CaptureController implements CaptureControllerApi {
  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
    private readonly afterNextRender: () => Promise<void>,
  ) {}

  public async screenshot(options: ScreenshotOptions = {}): Promise<string> {
    this.assertActive();
    validateScreenshotOptions(options);
    await this.afterNextRender();
    this.assertActive();
    return readCanvasDataUrl(this.viewer, options);
  }

  public async downloadScreenshot(options: DownloadScreenshotOptions = {}): Promise<string> {
    this.assertActive();
    validateDownloadScreenshotOptions(options);

    if (typeof document === 'undefined') {
      throw new Error('downloadScreenshot 需要浏览器 document。');
    }

    const dataUrl = await this.screenshot(options);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = options.filename ?? getDefaultScreenshotFilename(options);
    document.body.append(link);
    link.click();
    link.remove();
    return dataUrl;
  }

  public dispose(): void {
    // capture 没有自己的常驻资源，等待中的渲染由 scene 模块统一释放
  }
}

function readCanvasDataUrl(viewer: Viewer, options: ScreenshotOptions): string {
  const canvas = getCanvas(viewer);
  const mimeType = getScreenshotFormat(options).mimeType;

  if (options.quality === undefined) {
    return canvas.toDataURL(mimeType);
  }

  return canvas.toDataURL(mimeType, options.quality);
}

function getDefaultScreenshotFilename(options: ScreenshotOptions): string {
  return `cesium-plus-screenshot.${getScreenshotFormat(options).extension}`;
}

function getScreenshotFormat(options: ScreenshotOptions): ScreenshotFormatDefinition {
  return screenshotFormats[options.format ?? defaultScreenshotFormat];
}

function validateDownloadScreenshotOptions(options: DownloadScreenshotOptions): void {
  validateScreenshotOptions(options);

  if (options.filename !== undefined) {
    validateFilename(options.filename);
  }
}

function validateScreenshotOptions(options: ScreenshotOptions): void {
  const candidate = options as Partial<ScreenshotOptions> | null | undefined;

  if (!candidate || typeof candidate !== 'object') {
    throw new TypeError('capture.screenshot 需要 options 对象。');
  }

  if (candidate.format !== undefined && !Object.hasOwn(screenshotFormats, candidate.format)) {
    throw new TypeError('capture.screenshot format 只能是 png、jpeg 或 webp。');
  }

  if (candidate.quality !== undefined) {
    validateQuality(candidate.quality);
  }
}

function validateQuality(quality: number): void {
  if (typeof quality !== 'number' || !Number.isFinite(quality) || quality < 0 || quality > 1) {
    throw new TypeError('capture.screenshot quality 必须是 0 到 1 之间的数字。');
  }
}

function validateFilename(filename: string): void {
  if (typeof filename !== 'string' || filename.trim().length === 0) {
    throw new TypeError('capture.downloadScreenshot filename 必须是非空字符串。');
  }
}

function getCanvas(viewer: Viewer): CanvasLike {
  const scene = (viewer as { readonly scene?: unknown }).scene;

  if (!scene || typeof scene !== 'object') {
    throw new Error('capture 模块需要有效的 Cesium Scene。');
  }

  const canvas = (scene as { readonly canvas?: unknown }).canvas;

  if (
    !canvas ||
    typeof canvas !== 'object' ||
    typeof (canvas as CanvasLike).toDataURL !== 'function'
  ) {
    throw new Error('capture 模块需要可导出的画布。');
  }

  return canvas as CanvasLike;
}

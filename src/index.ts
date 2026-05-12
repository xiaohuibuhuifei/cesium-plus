import type { Viewer } from 'cesium';

import { createCamera } from './modules/camera.js';
import type { CesiumPlusCamera } from './modules/camera.js';
import { createCapture } from './modules/capture.js';
import type { CesiumPlusCapture } from './modules/capture.js';
import { createCoordinates } from './modules/coordinates.js';
import type { CesiumPlusCoordinates } from './modules/coordinates.js';
import { createScene } from './modules/scene.js';
import type { CesiumPlusScene } from './modules/scene.js';

/**
 * Cesium Plus 资源清理函数。
 *
 * 清理函数应保持幂等；如果同一资源可能被调用方和 Cesium Plus 同时释放，
 * 实现方必须自行避免重复销毁底层 Cesium 对象或浏览器监听器。
 */
export type CesiumPlusCleanup = () => void;

/**
 * 插件安装时收到的上下文。
 *
 * `viewer` 是调用方创建的原始 Cesium Viewer，`plus` 是当前增强管理器。
 * 插件不得接管 Viewer 生命周期。
 */
export interface CesiumPlusPluginContext {
  /** 调用方传入的原始 Cesium Viewer。 */
  readonly viewer: Viewer;
  readonly plus: CesiumPlus;
}

/**
 * Cesium Plus 插件定义。
 *
 * 插件按 `name` 去重安装。`install` 可以不返回值；需要释放事件监听、
 * 图元、定时器等资源时，返回一个清理函数。
 */
export interface CesiumPlusPlugin {
  /** 插件名称，同一个 CesiumPlus 实例内必须唯一、非空且不能包含首尾空白。 */
  readonly name: string;
  /**
   * 安装插件。
   *
   * 返回清理函数时，`CesiumPlus.dispose()` 会按安装顺序反向调用它。
   */
  install(context: CesiumPlusPluginContext): void | CesiumPlusCleanup;
}

/**
 * Cesium Plus 增强管理器。
 *
 * 只绑定调用方传入的 Cesium Viewer，不创建、不销毁、不替换 Viewer。
 * 内置能力直接挂在实例上，插件通过 `use()` 安装并由 `dispose()` 统一释放。
 */
export class CesiumPlus {
  // 插件按名称去重，避免同一个增强能力被重复安装到同一个 Viewer
  readonly #plugins = new Map<string, CesiumPlusCleanup | undefined>();
  readonly #moduleCleanups: CesiumPlusCleanup[] = [];
  #disposed = false;
  /** 调用方传入的原始 Cesium Viewer；Cesium Plus 不接管它的生命周期。 */
  public readonly viewer: Viewer;
  /** 内置相机任务能力，不进入插件列表。 */
  public readonly camera: CesiumPlusCamera;
  /** 内置画布截图和下载能力，不需要通过插件安装。 */
  public readonly capture: CesiumPlusCapture;
  /** 内置鼠标坐标监听能力，不进入插件列表。 */
  public readonly coordinates: CesiumPlusCoordinates;
  /** 内置场景渲染能力，不进入插件列表。 */
  public readonly scene: CesiumPlusScene;

  /**
   * 创建增强管理器。
   *
   * @throws TypeError 当 `viewer` 为空时抛出。
   */
  public constructor(viewer: Viewer) {
    if (!viewer) {
      throw new TypeError('CesiumPlus 需要一个 Cesium Viewer。');
    }

    this.viewer = viewer;
    const scene = createScene(viewer, () => this.#assertActive());
    this.scene = scene;
    const camera = createCamera(viewer, () => this.#assertActive());
    this.camera = camera;
    const capture = createCapture(
      viewer,
      () => this.#assertActive(),
      () => scene.afterNextRender(),
    );
    this.capture = capture;
    const coordinates = createCoordinates(viewer, () => this.#assertActive());
    this.coordinates = coordinates;
    this.#moduleCleanups.push(() => scene.dispose());
    this.#moduleCleanups.push(() => camera.dispose());
    this.#moduleCleanups.push(() => capture.dispose());
    this.#moduleCleanups.push(() => coordinates.dispose());
  }

  /** 当前增强管理器是否已经释放。释放后不能继续安装插件或使用内置能力。 */
  public get disposed(): boolean {
    return this.#disposed;
  }

  /** 已安装插件名称，按安装顺序返回；释放后返回空数组。 */
  public get pluginNames(): readonly string[] {
    return [...this.#plugins.keys()];
  }

  /**
   * 安装插件并返回当前实例，方便链式调用。
   *
   * 同名插件只会安装一次。实例释放后调用会抛出错误。
   *
   * @returns 当前 CesiumPlus 实例。
   * @throws TypeError 当插件形状无效或清理回调无效时抛出。
   */
  public use(plugin: CesiumPlusPlugin): this {
    this.#assertActive();
    validatePlugin(plugin);

    if (this.#plugins.has(plugin.name)) {
      return this;
    }

    const cleanup = plugin.install({
      plus: this,
      viewer: this.viewer,
    });

    if (cleanup !== undefined && typeof cleanup !== 'function') {
      throw new TypeError(`CesiumPlus 插件 "${plugin.name}" 返回了无效的释放回调。`);
    }

    // 插件可以没有释放逻辑；内部统一成 undefined，避免 void 类型污染插件表
    const installedCleanup = typeof cleanup === 'function' ? cleanup : undefined;
    this.#plugins.set(plugin.name, installedCleanup);
    return this;
  }

  /**
   * 释放插件和内置模块资源。
   *
   * 可重复调用。释放顺序与安装顺序相反；如果多个清理函数抛错，
   * 会继续释放剩余资源，最后抛出 `AggregateError`。
   */
  public dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    const pluginCleanups = [...this.#plugins.values()].reverse();
    const moduleCleanups = [...this.#moduleCleanups].reverse();
    this.#plugins.clear();
    this.#moduleCleanups.length = 0;

    const errors: unknown[] = [];

    for (const cleanup of [...pluginCleanups, ...moduleCleanups]) {
      if (!cleanup) {
        continue;
      }

      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, '一个或多个 CesiumPlus 资源释放失败。');
    }
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new Error('CesiumPlus 已经释放。');
    }
  }
}

/**
 * 用调用方传入的 Cesium Viewer 创建增强管理器。
 *
 * 这个函数不创建、不销毁、不替换 Viewer。
 *
 * @returns Cesium Plus 增强管理器。
 * @throws TypeError 当 `viewer` 为空时抛出。
 */
export function create(viewer: Viewer): CesiumPlus {
  return new CesiumPlus(viewer);
}

/**
 * 校验并返回插件定义。
 *
 * 这个函数不安装插件，只用于让插件定义处的运行时约束更明确。
 *
 * @returns 原插件定义对象。
 * @throws TypeError 当插件名称或安装函数无效时抛出。
 */
export function definePlugin(plugin: CesiumPlusPlugin): CesiumPlusPlugin {
  validatePlugin(plugin);
  return plugin;
}

// 运行时也要校验插件形状；TypeScript 类型挡不住普通 JavaScript 用户
function validatePlugin(plugin: CesiumPlusPlugin): void {
  const candidate = plugin as Partial<CesiumPlusPlugin> | null | undefined;

  if (!candidate || typeof candidate !== 'object') {
    throw new TypeError('CesiumPlus 插件必须是对象。');
  }

  if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    throw new TypeError('CesiumPlus 插件需要非空名称。');
  }

  if (candidate.name !== candidate.name.trim()) {
    throw new TypeError('CesiumPlus 插件名称不能包含首尾空白。');
  }

  if (typeof candidate.install !== 'function') {
    throw new TypeError('CesiumPlus 插件需要 install 函数。');
  }
}

export type {
  CameraChangedCallback,
  CameraView,
  CesiumPlusCamera,
  FlyToPointOptions,
  LngLatPoint,
} from './modules/camera.js';
export type {
  CesiumPlusCapture,
  DownloadScreenshotOptions,
  ScreenshotFormat,
  ScreenshotOptions,
} from './modules/capture.js';
export type {
  CesiumPlusCoordinates,
  CoordinatePosition,
  CoordinateWatchCallback,
} from './modules/coordinates.js';
export type { CesiumPlusScene } from './modules/scene.js';

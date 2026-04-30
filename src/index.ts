import type { Viewer } from 'cesium';

export type CesiumPlusCleanup = () => void;

export interface CesiumPlusPluginContext {
  readonly viewer: Viewer;
  readonly plus: CesiumPlus;
}

export interface CesiumPlusPlugin {
  readonly name: string;
  install(context: CesiumPlusPluginContext): void | CesiumPlusCleanup;
}

export class CesiumPlus {
  // 插件按名称去重，避免同一个增强能力被重复安装到同一个 Viewer。
  readonly #plugins = new Map<string, CesiumPlusCleanup | undefined>();
  #disposed = false;

  public constructor(public readonly viewer: Viewer) {
    if (!viewer) {
      throw new TypeError('CesiumPlus 需要一个 Cesium Viewer。');
    }
  }

  public get disposed(): boolean {
    return this.#disposed;
  }

  public get pluginNames(): readonly string[] {
    return [...this.#plugins.keys()];
  }

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
      throw new TypeError(
        `CesiumPlus 插件 "${plugin.name}" 返回了无效的释放回调。`,
      );
    }

    // 插件可以没有释放逻辑；内部统一成 undefined，避免 void 类型污染插件表。
    const installedCleanup =
      typeof cleanup === 'function' ? cleanup : undefined;
    this.#plugins.set(plugin.name, installedCleanup);
    return this;
  }

  public dispose(): void {
    if (this.#disposed) {
      return;
    }

    this.#disposed = true;
    // 后安装的插件通常依赖先安装的插件，释放时必须反向执行。
    const cleanups = [...this.#plugins.values()].reverse();
    this.#plugins.clear();

    const errors: unknown[] = [];

    for (const cleanup of cleanups) {
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
      throw new AggregateError(errors, '一个或多个 CesiumPlus 插件释放失败。');
    }
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw new Error('CesiumPlus 已经释放。');
    }
  }
}

export function createCesiumPlus(viewer: Viewer): CesiumPlus {
  return new CesiumPlus(viewer);
}

export const create = createCesiumPlus;

export function definePlugin(plugin: CesiumPlusPlugin): CesiumPlusPlugin {
  validatePlugin(plugin);
  return plugin;
}

// 运行时也要校验插件形状；TypeScript 类型挡不住普通 JavaScript 用户。
function validatePlugin(plugin: CesiumPlusPlugin): void {
  const candidate = plugin as Partial<CesiumPlusPlugin> | null | undefined;

  if (!candidate || typeof candidate !== 'object') {
    throw new TypeError('CesiumPlus 插件必须是对象。');
  }

  if (
    typeof candidate.name !== 'string' ||
    candidate.name.trim().length === 0
  ) {
    throw new TypeError('CesiumPlus 插件需要非空名称。');
  }

  if (typeof candidate.install !== 'function') {
    throw new TypeError('CesiumPlus 插件需要 install 函数。');
  }
}

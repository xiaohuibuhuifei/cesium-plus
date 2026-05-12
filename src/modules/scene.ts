import type { Viewer } from 'cesium';

type RemoveListener = () => void;

interface PendingRenderWait {
  readonly reject: (error: unknown) => void;
  removeListener: RemoveListener;
}

interface PostRenderEventLike {
  addEventListener(listener: () => void): RemoveListener;
}

interface SceneLike {
  readonly postRender: PostRenderEventLike;
  requestRender(): void;
}

export interface CesiumPlusScene {
  /**
   * 显式请求 Cesium 渲染下一帧。
   *
   * 这个方法本身不注册常驻监听，只把渲染请求交给当前 Scene。
   *
   * @throws Error 当 Cesium Plus 已释放或当前 Viewer 缺少有效 Scene 时抛出。
   */
  requestRender(): void;
  /**
   * 等待下一次 `postRender` 完成。
   *
   * 这个方法会显式请求一次渲染，并在下一帧完成后 resolve。
   *
   * @throws Error 当 Cesium Plus 已释放、当前 Viewer 缺少有效 Scene 或请求渲染失败时拒绝。
   */
  afterNextRender(): Promise<void>;
}

interface SceneControllerApi extends CesiumPlusScene {
  dispose(): void;
}

const disposedErrorMessage = 'CesiumPlus 已经释放。';

export function createScene(viewer: Viewer, assertActive: () => void): SceneControllerApi {
  return new SceneController(viewer, assertActive);
}

class SceneController implements SceneControllerApi {
  readonly #pendingRenderWaits = new Set<PendingRenderWait>();

  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
  ) {}

  public requestRender(): void {
    this.assertActive();
    getScene(this.viewer).requestRender();
  }

  public async afterNextRender(): Promise<void> {
    this.assertActive();
    await this.waitForNextRender();
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
      throw new AggregateError(errors, '一个或多个场景监听释放失败。');
    }
  }

  private waitForNextRender(): Promise<void> {
    return new Promise((resolve, reject) => {
      const scene = getScene(this.viewer);

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

        try {
          pending.removeListener();
        } catch (removeError) {
          reject(new AggregateError([error, removeError], 'CesiumPlus scene 请求渲染失败。'));
          return;
        }

        reject(error);
      }
    });
  }
}

function getScene(viewer: Viewer): SceneLike {
  const scene = (viewer as { readonly scene?: unknown }).scene;

  if (!scene || typeof scene !== 'object') {
    throw new Error('scene 模块需要有效的 Cesium Scene。');
  }

  const candidate = scene as Partial<SceneLike>;

  if (
    !candidate.postRender ||
    typeof candidate.postRender !== 'object' ||
    typeof candidate.postRender.addEventListener !== 'function' ||
    typeof candidate.requestRender !== 'function'
  ) {
    throw new Error('scene 模块需要有效的 Cesium Scene。');
  }

  return candidate as SceneLike;
}

import type { Cartesian2, Cartesian3, Cartographic, Viewer } from 'cesium';
import {
  Cartographic as CartographicCtor,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';

type Cleanup = () => void;
const unsupportedCoordinatesMessage =
  'coordinates.watchMouse 需要 Cesium Scene 支持 pickPosition。';

interface CoordinatePickingScene {
  readonly pickPosition?: unknown;
  readonly pickPositionSupported?: boolean;
}

export interface CoordinatePosition {
  /** 经度，单位为度。 */
  readonly longitude: number;
  /** 纬度，单位为度。 */
  readonly latitude: number;
  /** 高度，单位与 Cesium `Cartographic.height` 保持一致。 */
  readonly height: number;
}

/** 鼠标移动并成功取到场景位置时触发。 */
export type CoordinateWatchCallback = (coord: CoordinatePosition) => void;

/**
 * Cesium Plus 内置坐标监听能力。
 *
 * 使用 Cesium `pickPosition` 从鼠标位置读取场景坐标。
 */
export interface CesiumPlusCoordinates {
  /**
   * 当前 Cesium Scene 是否支持鼠标坐标监听。
   */
  readonly canWatchMouse: boolean;
  /**
   * 监听鼠标移动坐标，返回幂等清理函数。
   *
   * 如果调用方没有手动清理，`CesiumPlus.dispose()` 会兜底释放监听器。
   *
   * @throws TypeError 当 callback 无效时抛出。
   * @throws Error 当 Cesium Plus 已释放或当前 Scene 不支持 `pickPosition` 时抛出。
   */
  watchMouse(callback: CoordinateWatchCallback): Cleanup;
}

interface CoordinatesController extends CesiumPlusCoordinates {
  dispose(): void;
}

export function createCoordinates(viewer: Viewer, assertActive: () => void): CoordinatesController {
  return new CoordinatesModule(viewer, assertActive);
}

class CoordinatesModule implements CoordinatesController {
  readonly #cleanups = new Set<Cleanup>();
  public readonly canWatchMouse: boolean;

  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
  ) {
    this.canWatchMouse = isCoordinatePickingSupported(viewer);
  }

  public watchMouse(callback: CoordinateWatchCallback): Cleanup {
    this.assertActive();
    validateWatchCallback(callback);

    if (!this.canWatchMouse) {
      throw new Error(unsupportedCoordinatesMessage);
    }

    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    let active = true;

    handler.setInputAction(
      (movement: { endPosition: Cartesian2 }) => this.handleMove(movement, callback),
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    const cleanup = () => {
      if (!active) {
        return;
      }

      active = false;
      this.#cleanups.delete(cleanup);

      if (!handler.isDestroyed()) {
        handler.destroy();
      }
    };

    this.#cleanups.add(cleanup);
    return cleanup;
  }

  public dispose(): void {
    const cleanups = [...this.#cleanups];
    const errors: unknown[] = [];

    for (const cleanup of cleanups) {
      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, '一个或多个坐标监听释放失败。');
    }
  }

  private handleMove(
    movement: { endPosition: Cartesian2 },
    callback: CoordinateWatchCallback,
  ): void {
    const position: Cartesian3 | undefined = this.viewer.scene.pickPosition(movement.endPosition);

    if (!position) {
      return;
    }

    const cartographic: Cartographic = CartographicCtor.fromCartesian(position);

    if (!cartographic) {
      return;
    }

    callback({
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      height: cartographic.height,
    });
  }
}

function validateWatchCallback(callback: CoordinateWatchCallback): void {
  if (typeof callback !== 'function') {
    throw new TypeError('coordinates.watchMouse 需要 callback 函数。');
  }
}

function isCoordinatePickingSupported(viewer: Viewer): boolean {
  const scene = getCoordinatePickingScene(viewer);

  return Boolean(
    scene && scene.pickPositionSupported !== false && typeof scene.pickPosition === 'function',
  );
}

function getCoordinatePickingScene(viewer: Viewer): CoordinatePickingScene | undefined {
  const scene = (viewer as { readonly scene?: unknown }).scene;

  if (!scene || typeof scene !== 'object') {
    return undefined;
  }

  return scene as CoordinatePickingScene;
}

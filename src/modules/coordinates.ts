import type { Cartesian2, Cartesian3, Cartographic, Viewer } from 'cesium';
import {
  Cartographic as CartographicCtor,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';

type Cleanup = () => void;

export interface CoordinatePosition {
  readonly longitude: number;
  readonly latitude: number;
  readonly height: number;
}

export interface CoordinateWatchOptions {
  readonly onMove: (coord: CoordinatePosition) => void;
}

export interface CesiumPlusCoordinates {
  /**
   * watch
   *
   * @param options 坐标监听选项
   * @returns 坐标监听清理函数
   */
  watch(options: CoordinateWatchOptions): Cleanup;
}

interface CoordinatesController extends CesiumPlusCoordinates {
  dispose(): void;
}

/**
 * createCoordinates
 *
 * @param viewer Cesium Viewer 实例
 * @param assertActive CesiumPlus 生命周期校验函数
 * @returns CesiumPlus 内置坐标能力
 */
export function createCoordinates(
  viewer: Viewer,
  assertActive: () => void,
): CoordinatesController {
  return new CoordinatesModule(viewer, assertActive);
}

class CoordinatesModule implements CoordinatesController {
  readonly #cleanups = new Set<Cleanup>();

  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
  ) {}

  /**
   * watch
   *
   * @param options 坐标监听选项
   * @returns 坐标监听清理函数
   */
  public watch(options: CoordinateWatchOptions): Cleanup {
    this.assertActive();

    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    let active = true;

    handler.setInputAction(
      (movement: { endPosition: Cartesian2 }) =>
        this.handleMove(movement, options),
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
    options: CoordinateWatchOptions,
  ): void {
    const position: Cartesian3 | undefined = this.viewer.scene.pickPosition(
      movement.endPosition,
    );

    if (!position) {
      return;
    }

    const cartographic: Cartographic = CartographicCtor.fromCartesian(position);

    if (!cartographic) {
      return;
    }

    options.onMove({
      longitude: CesiumMath.toDegrees(cartographic.longitude),
      latitude: CesiumMath.toDegrees(cartographic.latitude),
      height: cartographic.height,
    });
  }
}

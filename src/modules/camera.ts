import type { Cartesian3, Viewer } from 'cesium';
import { Cartesian3 as Cartesian3Ctor, Math as CesiumMath } from 'cesium';

type Cleanup = () => void;

interface CartographicLike {
  readonly height: number;
  readonly latitude: number;
  readonly longitude: number;
}

interface CameraChangedEventLike {
  addEventListener(listener: () => void): Cleanup;
}

interface CameraLike {
  readonly changed: CameraChangedEventLike;
  readonly heading: number;
  readonly pitch: number;
  readonly positionCartographic: CartographicLike;
  readonly roll: number;
  cancelFlight(): void;
  flyTo(options: FlyToOptions): void;
  setView(options: SetViewOptions): void;
}

interface PendingFlight {
  readonly reject: (error: unknown) => void;
}

interface CameraOrientationRadians {
  heading?: number;
  pitch?: number;
  roll?: number;
}

interface SetViewOptions {
  destination: Cartesian3;
  orientation?: CameraOrientationRadians;
}

interface FlyToOptions extends SetViewOptions {
  cancel?: () => void;
  complete?: () => void;
  duration?: number;
}

export interface LngLatPoint {
  /** 经度，单位为度。 */
  readonly lng: number;
  /** 纬度，单位为度。 */
  readonly lat: number;
  /** 高度，单位为米；不传时默认使用 0。 */
  readonly alt?: number;
}

export interface CameraView extends LngLatPoint {
  /** 高度，单位为米。 */
  readonly alt: number;
  /** 航向角，单位为度。 */
  readonly heading?: number;
  /** 俯仰角，单位为度。 */
  readonly pitch?: number;
  /** 翻滚角，单位为度。 */
  readonly roll?: number;
}

export interface FlyToPointOptions {
  /** 飞行目标高度，单位为米；不传时回退到 point.alt 或 0。 */
  readonly alt?: number;
  /** 飞行时长，单位为秒。 */
  readonly duration?: number;
  /** 飞行完成后的航向角，单位为度。 */
  readonly heading?: number;
  /** 飞行完成后的俯仰角，单位为度。 */
  readonly pitch?: number;
  /** 飞行完成后的翻滚角，单位为度。 */
  readonly roll?: number;
}

/** 相机变化时收到当前视角快照。 */
export type CameraChangedCallback = (view: CameraView) => void;

/**
 * Cesium Plus 内置相机能力。
 *
 * 这个模块只包装高频相机任务，不接管 Cesium Camera 生命周期。
 */
export interface CesiumPlusCamera {
  /**
   * 读取当前相机视角。
   *
   * 返回值使用经纬高和角度值，便于普通调用方直接消费。
   *
   * @throws Error 当 Cesium Plus 已释放或当前 Viewer 缺少有效 Camera 时抛出。
   */
  getCameraView(): CameraView;
  /**
   * 立即设置相机视角。
   *
   * @throws TypeError 当视角参数无效时抛出。
   * @throws Error 当 Cesium Plus 已释放或当前 Viewer 缺少有效 Camera 时抛出。
   */
  setCameraView(view: CameraView): void;
  /**
   * 飞行到指定经纬度点位。
   *
   * `point.alt` 和 `options.alt` 都不传时，默认飞到高度 0。
   *
   * @throws TypeError 当 point 或 options 无效时拒绝。
   * @throws Error 当 Cesium Plus 已释放、当前 Viewer 缺少有效 Camera 或飞行被取消时拒绝。
   */
  flyToPoint(point: LngLatPoint, options?: FlyToPointOptions): Promise<void>;
  /**
   * 取消当前飞行并拒绝等待中的飞行 Promise。
   *
   * @throws Error 当 Cesium Plus 已释放或当前 Viewer 缺少有效 Camera 时抛出。
   */
  cancelFlight(): void;
  /**
   * 监听相机变化并返回幂等清理函数。
   *
   * @throws TypeError 当 callback 无效时抛出。
   * @throws Error 当 Cesium Plus 已释放或当前 Viewer 缺少有效 Camera 时抛出。
   */
  watchCameraChanged(callback: CameraChangedCallback): Cleanup;
}

interface CameraControllerApi extends CesiumPlusCamera {
  dispose(): void;
}

const cancelledFlightErrorMessage = 'camera.flyToPoint 已被取消。';
const disposedErrorMessage = 'CesiumPlus 已经释放。';

export function createCamera(viewer: Viewer, assertActive: () => void): CameraControllerApi {
  return new CameraController(viewer, assertActive);
}

class CameraController implements CameraControllerApi {
  readonly #cleanups = new Set<Cleanup>();
  readonly #pendingFlights = new Set<PendingFlight>();

  public constructor(
    private readonly viewer: Viewer,
    private readonly assertActive: () => void,
  ) {}

  public getCameraView(): CameraView {
    this.assertActive();
    const camera = getCamera(this.viewer);
    return readCameraView(camera);
  }

  public setCameraView(view: CameraView): void {
    this.assertActive();
    validateCameraView(view);
    const camera = getCamera(this.viewer);
    const orientation = toOrientation(view);
    const setViewOptions: SetViewOptions = {
      destination: toDestination(view),
    };

    if (orientation) {
      setViewOptions.orientation = orientation;
    }

    camera.setView(setViewOptions);
    requestRenderIfAvailable(this.viewer);
  }

  public async flyToPoint(point: LngLatPoint, options: FlyToPointOptions = {}): Promise<void> {
    this.assertActive();
    validateLngLatPoint(point, 'camera.flyToPoint');
    validateFlyToPointOptions(options);
    const camera = getCamera(this.viewer);

    await new Promise<void>((resolve, reject) => {
      const pendingFlight: PendingFlight = {
        reject,
      };

      const finish = (callback: () => void) => {
        if (!this.#pendingFlights.delete(pendingFlight)) {
          return;
        }

        callback();
      };

      this.#pendingFlights.add(pendingFlight);

      try {
        const flyToOptions: FlyToOptions = {
          cancel: () => finish(() => reject(new Error(cancelledFlightErrorMessage))),
          complete: () => finish(resolve),
          destination: toDestination({
            alt: options.alt ?? point.alt ?? 0,
            lat: point.lat,
            lng: point.lng,
          }),
        };
        const orientation = toOrientation(options);

        if (options.duration !== undefined) {
          flyToOptions.duration = options.duration;
        }

        if (orientation) {
          flyToOptions.orientation = orientation;
        }

        camera.flyTo(flyToOptions);
      } catch (error) {
        this.#pendingFlights.delete(pendingFlight);
        reject(error);
      }
    });
  }

  public cancelFlight(): void {
    this.assertActive();
    const camera = getCamera(this.viewer);
    camera.cancelFlight();
    this.rejectPendingFlights(new Error(cancelledFlightErrorMessage));
    requestRenderIfAvailable(this.viewer);
  }

  public watchCameraChanged(callback: CameraChangedCallback): Cleanup {
    this.assertActive();
    validateCameraChangedCallback(callback);
    const camera = getCamera(this.viewer);
    const listener = () => {
      callback(readCameraView(camera));
    };
    const removeListener = camera.changed.addEventListener(listener);
    let active = true;

    const cleanup = () => {
      if (!active) {
        return;
      }

      active = false;
      this.#cleanups.delete(cleanup);
      removeListener();
    };

    this.#cleanups.add(cleanup);
    return cleanup;
  }

  public dispose(): void {
    const errors: unknown[] = [];

    if (this.#pendingFlights.size > 0) {
      try {
        const camera = getCamera(this.viewer);
        camera.cancelFlight();
      } catch (error) {
        errors.push(error);
      }
    }

    this.rejectPendingFlights(new Error(disposedErrorMessage));

    for (const cleanup of [...this.#cleanups]) {
      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, '一个或多个相机资源释放失败。');
    }
  }

  private rejectPendingFlights(error: Error): void {
    for (const pendingFlight of [...this.#pendingFlights]) {
      this.#pendingFlights.delete(pendingFlight);
      pendingFlight.reject(error);
    }
  }
}

function readCameraView(camera: CameraLike): CameraView {
  const position = camera.positionCartographic;

  if (
    !position ||
    typeof position.longitude !== 'number' ||
    typeof position.latitude !== 'number' ||
    typeof position.height !== 'number'
  ) {
    throw new Error('camera 模块需要有效的 Cesium Camera。');
  }

  return {
    alt: position.height,
    heading: CesiumMath.toDegrees(camera.heading),
    lat: CesiumMath.toDegrees(position.latitude),
    lng: CesiumMath.toDegrees(position.longitude),
    pitch: CesiumMath.toDegrees(camera.pitch),
    roll: CesiumMath.toDegrees(camera.roll),
  };
}

function toDestination(point: LngLatPoint): Cartesian3 {
  return Cartesian3Ctor.fromDegrees(point.lng, point.lat, point.alt ?? 0);
}

function toOrientation(
  view: Partial<CameraView> | FlyToPointOptions,
): CameraOrientationRadians | undefined {
  const orientation: CameraOrientationRadians = {};

  if (view.heading !== undefined) {
    orientation.heading = CesiumMath.toRadians(view.heading);
  }

  if (view.pitch !== undefined) {
    orientation.pitch = CesiumMath.toRadians(view.pitch);
  }

  if (view.roll !== undefined) {
    orientation.roll = CesiumMath.toRadians(view.roll);
  }

  return Object.keys(orientation).length > 0 ? orientation : undefined;
}

function validateLngLatPoint(point: LngLatPoint, methodName: string): void {
  const candidate = point as Partial<LngLatPoint> | null | undefined;

  if (!candidate || typeof candidate !== 'object') {
    throw new TypeError(`${methodName} 需要 point 对象。`);
  }

  validateCoordinateNumber(candidate.lng, `${methodName} lng 必须是有限数字。`);
  validateCoordinateNumber(candidate.lat, `${methodName} lat 必须是有限数字。`);

  if (candidate.alt !== undefined) {
    validateCoordinateNumber(candidate.alt, `${methodName} alt 必须是有限数字。`);
  }
}

function validateCameraView(view: CameraView): void {
  validateLngLatPoint(view, 'camera.setCameraView');
  validateCoordinateNumber(view.alt, 'camera.setCameraView alt 必须是有限数字。');

  if (view.heading !== undefined) {
    validateCoordinateNumber(view.heading, 'camera.setCameraView heading 必须是有限数字。');
  }

  if (view.pitch !== undefined) {
    validateCoordinateNumber(view.pitch, 'camera.setCameraView pitch 必须是有限数字。');
  }

  if (view.roll !== undefined) {
    validateCoordinateNumber(view.roll, 'camera.setCameraView roll 必须是有限数字。');
  }
}

function validateFlyToPointOptions(options: FlyToPointOptions): void {
  const candidate = options as Partial<FlyToPointOptions> | null | undefined;

  if (!candidate || typeof candidate !== 'object') {
    throw new TypeError('camera.flyToPoint 需要 options 对象。');
  }

  if (candidate.alt !== undefined) {
    validateCoordinateNumber(candidate.alt, 'camera.flyToPoint alt 必须是有限数字。');
  }

  if (candidate.duration !== undefined) {
    if (
      typeof candidate.duration !== 'number' ||
      !Number.isFinite(candidate.duration) ||
      candidate.duration < 0
    ) {
      throw new TypeError('camera.flyToPoint duration 必须是大于等于 0 的数字。');
    }
  }

  if (candidate.heading !== undefined) {
    validateCoordinateNumber(candidate.heading, 'camera.flyToPoint heading 必须是有限数字。');
  }

  if (candidate.pitch !== undefined) {
    validateCoordinateNumber(candidate.pitch, 'camera.flyToPoint pitch 必须是有限数字。');
  }

  if (candidate.roll !== undefined) {
    validateCoordinateNumber(candidate.roll, 'camera.flyToPoint roll 必须是有限数字。');
  }
}

function validateCameraChangedCallback(callback: CameraChangedCallback): void {
  if (typeof callback !== 'function') {
    throw new TypeError('camera.watchCameraChanged 需要 callback 函数。');
  }
}

function validateCoordinateNumber(value: unknown, message: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(message);
  }
}

function getCamera(viewer: Viewer): CameraLike {
  const camera = (viewer as { readonly camera?: unknown }).camera;

  if (!camera || typeof camera !== 'object') {
    throw new Error('camera 模块需要有效的 Cesium Camera。');
  }

  const candidate = camera as Partial<CameraLike>;

  if (
    !candidate.changed ||
    typeof candidate.changed !== 'object' ||
    typeof candidate.changed.addEventListener !== 'function' ||
    typeof candidate.cancelFlight !== 'function' ||
    typeof candidate.flyTo !== 'function' ||
    typeof candidate.setView !== 'function' ||
    typeof candidate.heading !== 'number' ||
    typeof candidate.pitch !== 'number' ||
    !candidate.positionCartographic ||
    typeof candidate.positionCartographic !== 'object' ||
    typeof candidate.roll !== 'number'
  ) {
    throw new Error('camera 模块需要有效的 Cesium Camera。');
  }

  return candidate as CameraLike;
}

function requestRenderIfAvailable(viewer: Viewer): void {
  const scene = (viewer as { readonly scene?: unknown }).scene;

  if (!scene || typeof scene !== 'object') {
    return;
  }

  const candidate = scene as { requestRender?: unknown };

  if (typeof candidate.requestRender === 'function') {
    candidate.requestRender();
  }
}

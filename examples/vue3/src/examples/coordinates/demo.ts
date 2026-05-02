import type { CesiumPlusExampleSession } from '../shared/cesium.js';

import { createCesiumPlusExampleSession } from '../shared/cesium.js';

export interface CoordinatesDemoCallbacks {
  onCoordinateChange(text: string): void;
  onSupportChange(text: string): void;
}

export interface CoordinatesDemoSession extends CesiumPlusExampleSession {
  readonly canWatchMouse: boolean;
}

export function mountCoordinatesDemo(
  element: HTMLDivElement,
  callbacks: CoordinatesDemoCallbacks,
): CoordinatesDemoSession {
  const baseSession = createCesiumPlusExampleSession(element, {
    targetLabel: 'Coordinate Target',
  });

  const canWatchMouse = baseSession.plus.coordinates.canWatchMouse;
  let stopWatching: (() => void) | undefined;

  if (canWatchMouse) {
    callbacks.onSupportChange('支持');
    stopWatching = baseSession.plus.coordinates.watchMouse(({ height, latitude, longitude }) => {
      callbacks.onCoordinateChange(
        `${longitude.toFixed(6)}, ${latitude.toFixed(6)}, ${height.toFixed(1)} m`,
      );
    });
  } else {
    callbacks.onSupportChange('不支持');
    callbacks.onCoordinateChange('当前 Scene 不支持 pickPosition。');
  }

  return {
    ...baseSession,
    canWatchMouse,
    dispose() {
      stopWatching?.();
      baseSession.dispose();
    },
  };
}

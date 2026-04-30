import type { Cartesian2, Cartesian3, Cartographic, Viewer } from 'cesium';
import {
  Cartographic as CartographicCtor,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
} from 'cesium';

import type { CesiumPlusPlugin } from '../index.js';

export interface CoordinateReadoutOptions {
  onMove: (coord: {
    longitude: number;
    latitude: number;
    height: number;
  }) => void;
}

export function coordinateReadout(
  options: CoordinateReadoutOptions,
): CesiumPlusPlugin {
  return {
    name: 'coordinate-readout',
    install({ viewer }: { viewer: Viewer }) {
      const handler = new ScreenSpaceEventHandler(
        viewer.scene.canvas,
      );

      handler.setInputAction((movement: {
        endPosition: Cartesian2;
      }) => {
        const position: Cartesian3 | undefined =
          viewer.scene.pickPosition(movement.endPosition);

        if (!position) {
          return;
        }

        const cartographic: Cartographic =
          CartographicCtor.fromCartesian(position);

        if (!cartographic) {
          return;
        }

        options.onMove({
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          height: cartographic.height,
        });
      }, ScreenSpaceEventType.MOUSE_MOVE);

      return () => {
        if (!handler.isDestroyed()) {
          handler.destroy();
        }
      };
    },
  };
}

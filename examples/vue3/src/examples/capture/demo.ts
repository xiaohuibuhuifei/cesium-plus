import type { CesiumPlusExampleSession } from '../shared/cesium.js';

import { createCesiumPlusExampleSession } from '../shared/cesium.js';

export interface CaptureDemoSession extends CesiumPlusExampleSession {
  downloadScreenshot(): Promise<string>;
  takeScreenshot(): Promise<string>;
}

export function mountCaptureDemo(element: HTMLDivElement): CaptureDemoSession {
  const baseSession = createCesiumPlusExampleSession(element, {
    targetLabel: 'Capture Target',
  });

  return {
    ...baseSession,
    downloadScreenshot() {
      return baseSession.plus.capture.downloadScreenshot({
        filename: 'cesium-plus-capture-example.png',
        format: 'png',
      });
    },
    takeScreenshot() {
      return baseSession.plus.capture.screenshot({
        format: 'png',
      });
    },
  };
}

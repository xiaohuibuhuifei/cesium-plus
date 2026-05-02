import type { CesiumPlusExampleSession } from '../shared/cesium.js';

import { createCesiumPlusExampleSession } from '../shared/cesium.js';

export type QuickStartDemoSession = CesiumPlusExampleSession;

export function mountQuickStartDemo(element: HTMLDivElement): QuickStartDemoSession {
  return createCesiumPlusExampleSession(element, {
    targetLabel: 'Quick Start Target',
  });
}

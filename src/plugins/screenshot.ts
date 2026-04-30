import type { Viewer } from 'cesium';

import type { CesiumPlusPlugin } from '../index.js';

export interface ScreenshotPlugin extends CesiumPlusPlugin {
  takeScreenshot(): string;
}

export function screenshot(): ScreenshotPlugin {
  let capturedViewer: Viewer | null = null;

  const plugin: ScreenshotPlugin = {
    name: 'screenshot',

    install({ viewer }: { viewer: Viewer }) {
      capturedViewer = viewer;
    },

    takeScreenshot(): string {
      if (!capturedViewer) {
        throw new Error('screenshot 插件尚未安装。');
      }

      return (capturedViewer.scene.canvas as HTMLCanvasElement).toDataURL(
        'image/png',
      );
    },
  };

  return plugin;
}

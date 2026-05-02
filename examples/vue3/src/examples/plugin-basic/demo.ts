import { Cartesian2, Cartesian3, Color, LabelStyle } from 'cesium';
import { definePlugin } from 'cesium-plus';

import type { CesiumPlusExampleSession } from '../shared/cesium.js';

import { createCesiumPlusExampleSession } from '../shared/cesium.js';

export interface PluginBasicDemoCallbacks {
  onCleanupChange(logs: readonly string[]): void;
  onSceneStatusChange(text: string): void;
}

export interface PluginBasicDemoSession extends CesiumPlusExampleSession {
  readonly attemptedInstallCount: number;
}

const attemptedInstallCount = 3;

export function mountPluginBasicDemo(
  element: HTMLDivElement,
  callbacks: PluginBasicDemoCallbacks,
): PluginBasicDemoSession {
  const baseSession = createCesiumPlusExampleSession(element, {
    targetLabel: 'Plugin Base Target',
  });
  const cleanupLogs: string[] = [];

  const pushCleanupLog = (name: string) => {
    cleanupLogs.push(name);
    callbacks.onCleanupChange([...cleanupLogs]);
  };

  const sceneStatusPlugin = definePlugin({
    name: 'scene-status',
    install: ({ viewer }) => {
      const update = () => {
        callbacks.onSceneStatusChange(
          `图元：${viewer.scene.primitives.length} / 实体：${viewer.entities.values.length}`,
        );
      };

      viewer.clock.onTick.addEventListener(update);
      update();

      return () => {
        viewer.clock.onTick.removeEventListener(update);
        pushCleanupLog('scene-status');
      };
    },
  });

  const markerOverlayPlugin = definePlugin({
    name: 'marker-overlay',
    install: ({ viewer }) => {
      const overlay = viewer.entities.add({
        label: {
          backgroundColor: Color.BLACK.withAlpha(0.62),
          fillColor: Color.WHITE,
          font: '14px sans-serif',
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cartesian2(0, -32),
          showBackground: true,
          style: LabelStyle.FILL_AND_OUTLINE,
          text: 'Plugin Overlay',
        },
        point: {
          color: Color.ORANGE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          pixelSize: 16,
        },
        position: Cartesian3.fromDegrees(
          baseSession.target.longitude + 0.02,
          baseSession.target.latitude + 0.015,
          baseSession.target.height * 0.6,
        ),
      });

      return () => {
        viewer.entities.remove(overlay);
        pushCleanupLog('marker-overlay');
      };
    },
  });

  baseSession.plus.use(sceneStatusPlugin).use(markerOverlayPlugin).use(markerOverlayPlugin);

  return {
    ...baseSession,
    attemptedInstallCount,
  };
}

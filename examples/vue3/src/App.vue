<script setup lang="ts">
import { Viewer } from 'cesium';
import * as CesiumPlus from 'cesium-plus';
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

const viewerElement = ref<HTMLDivElement | null>(null);
const statusText = ref('启动中');
const viewerRef = shallowRef<Viewer>();
const plusRef = shallowRef<CesiumPlus.CesiumPlus>();
let removeUnloadListener: (() => void) | undefined;

onMounted(() => {
  const element = viewerElement.value;

  if (!element) {
    throw new Error('缺少 Cesium Viewer 容器');
  }

  // 示例只保留最小 Viewer，减少和 Cesium Plus 无关的界面噪声。
  const viewer = new Viewer(element, {
    animation: false,
    baseLayer: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    timeline: false,
  });

  // 示例插件只观察公开 API，验证安装和释放路径，不碰 Cesium 内部实现。
  const plus = CesiumPlus.create(viewer).use(
    CesiumPlus.definePlugin({
      name: 'scene-status',
      install: ({ viewer }) => {
        const update = () => {
          statusText.value = `图元数量：${viewer.scene.primitives.length}`;
        };

        viewer.clock.onTick.addEventListener(update);
        update();

        return () => viewer.clock.onTick.removeEventListener(update);
      },
    }),
  );

  viewerRef.value = viewer;
  plusRef.value = plus;

  const handleBeforeUnload = () => disposeCesium();
  window.addEventListener('beforeunload', handleBeforeUnload, {
    once: true,
  });
  removeUnloadListener = () =>
    window.removeEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  removeUnloadListener?.();
  disposeCesium();
});

function disposeCesium(): void {
  const plus = plusRef.value;
  const viewer = viewerRef.value;

  plusRef.value = undefined;
  viewerRef.value = undefined;

  // 先释放增强插件，再销毁 Viewer；依赖方向反过来就容易出错。
  if (plus && !plus.disposed) {
    plus.dispose();
  }

  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }
}
</script>

<template>
  <main class="shell">
    <section class="viewer-panel">
      <div class="toolbar">
        <strong>Cesium Plus</strong>
        <span>{{ statusText }}</span>
      </div>
      <div ref="viewerElement" class="viewer"></div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { Cartesian2, Cartesian3, Color, LabelStyle, Viewer } from 'cesium';
import * as CesiumPlus from 'cesium-plus';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

const testTarget = {
  height: 1200,
  latitude: 39.9075,
  longitude: 116.3913,
};

const viewerElement = ref<HTMLDivElement | null>(null);
const statusText = ref('启动中');
const coordinateText = ref('未采样');
const detailText = ref('等待 Viewer 初始化');
const pluginNamesText = ref('未安装');
const disposedText = ref('未创建');
const pickSupportText = ref('未知');
const screenshotDataUrl = ref('');
const screenshotSizeText = ref('未生成');
const errorText = ref('');
const lifecycleCount = ref(0);
const viewerReady = ref(false);
const viewerRef = shallowRef<Viewer>();
const plusRef = shallowRef<CesiumPlus.CesiumPlus>();
let removeUnloadListener: (() => void) | undefined;

onMounted(() => {
  mountCesium();

  const handleBeforeUnload = () => disposeCesium();
  window.addEventListener('beforeunload', handleBeforeUnload, {
    once: true,
  });
  removeUnloadListener = () => window.removeEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  removeUnloadListener?.();
  disposeCesium();
});

const canUseCesiumPlus = computed(
  () => viewerReady.value && Boolean(plusRef.value && !plusRef.value.disposed),
);

const lifecycleText = computed(() =>
  viewerReady.value ? `第 ${lifecycleCount.value} 次运行` : '已释放',
);

function mountCesium(): void {
  const element = viewerElement.value;

  if (!element) {
    throw new Error('缺少 Cesium Viewer 容器');
  }

  disposeCesium();
  element.replaceChildren();
  resetReadouts();

  // 示例只保留最小 Viewer，减少和 Cesium Plus 无关的界面噪声
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

  addTestTarget(viewer);
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(testTarget.longitude, testTarget.latitude - 0.04, 6500),
    orientation: {
      heading: 0,
      pitch: -0.72,
      roll: 0,
    },
  });

  const plus = CesiumPlus.create(viewer).use(createSceneStatusPlugin());

  if (plus.coordinates.isSupported) {
    plus.coordinates.watch({
      onMove({ height, latitude, longitude }) {
        coordinateText.value = `${longitude.toFixed(6)}, ${latitude.toFixed(
          6,
        )}, ${height.toFixed(1)} m`;
      },
    });
  } else {
    coordinateText.value = '当前 Scene 不支持 pickPosition';
  }

  viewerRef.value = viewer;
  plusRef.value = plus;
  lifecycleCount.value += 1;
  viewerReady.value = true;
  disposedText.value = plus.disposed ? '已释放' : '运行中';
  pluginNamesText.value = plus.pluginNames.join(', ') || '无';
  pickSupportText.value = plus.coordinates.isSupported ? '支持' : '不支持';
  detailText.value = `测试目标：${testTarget.longitude.toFixed(
    4,
  )}, ${testTarget.latitude.toFixed(4)}`;
  viewer.scene.requestRender();
}

function createSceneStatusPlugin(): CesiumPlus.CesiumPlusPlugin {
  return CesiumPlus.definePlugin({
    name: 'scene-status',
    install: ({ viewer }) => {
      const update = () => {
        statusText.value = `图元：${viewer.scene.primitives.length} / 实体：${viewer.entities.values.length}`;
      };

      viewer.clock.onTick.addEventListener(update);
      update();

      return () => viewer.clock.onTick.removeEventListener(update);
    },
  });
}

function addTestTarget(viewer: Viewer): void {
  viewer.entities.add({
    id: 'cesium-plus-test-target',
    name: 'Cesium Plus 测试目标',
    position: Cartesian3.fromDegrees(testTarget.longitude, testTarget.latitude, testTarget.height),
    point: {
      color: Color.LIME,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelSize: 18,
    },
    label: {
      backgroundColor: Color.BLACK.withAlpha(0.62),
      fillColor: Color.WHITE,
      font: '14px sans-serif',
      outlineColor: Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cartesian2(0, -34),
      showBackground: true,
      style: LabelStyle.FILL_AND_OUTLINE,
      text: 'Test Target',
    },
  });
}

async function takeScreenshot(): Promise<void> {
  const plus = plusRef.value;

  if (!canUseCesiumPlus.value || !plus) {
    errorText.value = 'capture 不可用。';
    return;
  }

  try {
    screenshotSizeText.value = '生成中';
    const dataUrl = await plus.capture.screenshot();
    screenshotDataUrl.value = dataUrl;
    screenshotSizeText.value = `${dataUrl.length.toLocaleString()} 字符`;
    errorText.value = '';
  } catch (error) {
    errorText.value = getErrorMessage(error);
  }
}

async function downloadScreenshot(): Promise<void> {
  const plus = plusRef.value;

  if (!canUseCesiumPlus.value || !plus) {
    errorText.value = 'capture 不可用。';
    return;
  }

  try {
    screenshotSizeText.value = '下载中';
    const dataUrl = await plus.capture.downloadScreenshot({
      filename: 'cesium-plus-example.png',
    });
    screenshotDataUrl.value = dataUrl;
    screenshotSizeText.value = `${dataUrl.length.toLocaleString()} 字符`;
    errorText.value = '';
  } catch (error) {
    errorText.value = getErrorMessage(error);
  }
}

function releaseExample(): void {
  disposeCesium();
}

function rebuildExample(): void {
  mountCesium();
}

function disposeCesium(): void {
  const plus = plusRef.value;
  const viewer = viewerRef.value;

  plusRef.value = undefined;
  viewerRef.value = undefined;
  viewerReady.value = false;

  // 先释放增强插件，再销毁 Viewer；依赖方向反过来就容易出错
  if (plus && !plus.disposed) {
    plus.dispose();
  }

  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }

  if (plus || viewer) {
    statusText.value = '已释放';
    detailText.value = 'Viewer 已销毁';
    disposedText.value = '已释放';
    pluginNamesText.value = '已清空';
    pickSupportText.value = '未知';
  }
}

function resetReadouts(): void {
  statusText.value = '启动中';
  coordinateText.value = '未采样';
  detailText.value = '等待 Viewer 初始化';
  pluginNamesText.value = '未安装';
  disposedText.value = '未创建';
  pickSupportText.value = '未知';
  screenshotDataUrl.value = '';
  screenshotSizeText.value = '未生成';
  errorText.value = '';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
</script>

<template>
  <main class="shell">
    <section class="viewer-panel">
      <div class="toolbar">
        <div class="brand">
          <strong>Cesium Plus</strong>
          <span>{{ detailText }}</span>
        </div>
        <span class="run-state">{{ lifecycleText }}</span>
      </div>
      <div class="workspace">
        <div ref="viewerElement" class="viewer"></div>
        <aside class="control-panel">
          <section class="panel-section">
            <h2>运行状态</h2>
            <dl class="metric-list">
              <div>
                <dt>插件</dt>
                <dd>{{ pluginNamesText }}</dd>
              </div>
              <div>
                <dt>生命周期</dt>
                <dd>{{ disposedText }}</dd>
              </div>
              <div>
                <dt>场景</dt>
                <dd>{{ statusText }}</dd>
              </div>
              <div>
                <dt>捕获</dt>
                <dd>capture 内置</dd>
              </div>
              <div>
                <dt>坐标</dt>
                <dd>coordinates 内置</dd>
              </div>
              <div>
                <dt>PickPosition</dt>
                <dd>{{ pickSupportText }}</dd>
              </div>
            </dl>
          </section>

          <section class="panel-section">
            <h2>能力验证</h2>
            <div class="readout">
              <span>坐标读数</span>
              <strong>{{ coordinateText }}</strong>
            </div>
            <div class="readout">
              <span>截图</span>
              <strong>{{ screenshotSizeText }}</strong>
            </div>
            <div class="actions">
              <button type="button" :disabled="!canUseCesiumPlus" @click="takeScreenshot">
                生成截图
              </button>
              <button type="button" :disabled="!canUseCesiumPlus" @click="downloadScreenshot">
                下载截图
              </button>
              <button type="button" :disabled="!viewerReady" @click="releaseExample">释放</button>
              <button type="button" @click="rebuildExample">重建</button>
            </div>
            <p v-if="errorText" class="error-text">{{ errorText }}</p>
          </section>

          <section v-if="screenshotDataUrl" class="panel-section">
            <h2>截图预览</h2>
            <img :src="screenshotDataUrl" alt="Cesium canvas screenshot preview" />
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>

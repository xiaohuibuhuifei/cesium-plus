<script setup lang="ts">
import { computed, ref } from 'vue';

import ExamplePageShell from '../../components/ExamplePageShell.vue';
import { formatTarget, getErrorMessage } from '../shared/cesium.js';
import { useExampleRuntime } from '../shared/useExampleRuntime.js';
import { mountCoordinatesDemo, type CoordinatesDemoSession } from './demo.js';
import { coordinatesExample } from './meta.js';

const coordinateText = ref('未采样');
const detailText = ref('等待 Viewer 初始化');
const errorText = ref('');
const lifecycleText = ref('未创建');
const pickSupportText = ref('未知');

const runtime = useExampleRuntime<CoordinatesDemoSession>({
  beforeMount: resetReadouts,
  createSession: (element) =>
    mountCoordinatesDemo(element, {
      onCoordinateChange: (text) => {
        coordinateText.value = text;
      },
      onSupportChange: (text) => {
        pickSupportText.value = text;
      },
    }),
  onError: (error) => {
    errorText.value = getErrorMessage(error);
  },
  onSessionMounted: (session) => {
    lifecycleText.value = '运行中';
    detailText.value = session.canWatchMouse
      ? `将鼠标移到高亮目标附近：${formatTarget(session.target)}`
      : '当前 Scene 不支持鼠标取点。';
    errorText.value = '';
  },
  onSessionReleased: () => {
    lifecycleText.value = '已释放';
    pickSupportText.value = '未知';
    detailText.value = 'Viewer 已销毁';
    coordinateText.value = '监听已停止';
  },
});

const { isRunning, rebuild, release, runCount, viewerElement } = runtime;
const runText = computed(() => (isRunning.value ? `第 ${runCount.value} 次运行` : '已释放'));

function resetReadouts(): void {
  coordinateText.value = '未采样';
  detailText.value = '等待 Viewer 初始化';
  errorText.value = '';
  lifecycleText.value = '启动中';
  pickSupportText.value = '未知';
}
</script>

<template>
  <ExamplePageShell :example="coordinatesExample">
    <template #viewer>
      <div ref="viewerElement" class="example-viewer"></div>
    </template>

    <template #sidebar>
      <section class="inspector-section">
        <h3>读数</h3>
        <div class="metric-list">
          <div class="metric-row">
            <span class="metric-label">运行次数</span>
            <strong class="metric-value">{{ runText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">坐标读数</span>
            <strong class="metric-value">{{ coordinateText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">PickPosition</span>
            <strong class="metric-value">{{ pickSupportText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">生命周期</span>
            <strong class="metric-value">{{ lifecycleText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">说明提示</span>
            <strong class="metric-value">{{ detailText }}</strong>
          </div>
        </div>
      </section>

      <section class="inspector-section">
        <h3>当前操作</h3>
        <div class="action-row">
          <button class="example-button" type="button" @click="rebuild">重新挂载</button>
          <button class="example-button" type="button" :disabled="!isRunning" @click="release">
            停止监听
          </button>
        </div>
      </section>

      <section class="inspector-section">
        <h3>说明</h3>
        <p class="note-text">示例只在 `canWatchMouse` 为 true 时安装鼠标监听。</p>
        <p class="note-text">释放 Cesium Plus 后，页面不再依赖隐式兜底监听继续工作。</p>
        <p class="note-text">这个页面只验证鼠标取点，不混入截图或插件逻辑。</p>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </section>
    </template>
  </ExamplePageShell>
</template>

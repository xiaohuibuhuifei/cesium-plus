<script setup lang="ts">
import { computed, ref } from 'vue';

import ExamplePageShell from '../../components/ExamplePageShell.vue';
import { formatTarget, getErrorMessage } from '../shared/cesium.js';
import { useExampleRuntime } from '../shared/useExampleRuntime.js';
import { mountQuickStartDemo, type QuickStartDemoSession } from './demo.js';
import { quickStartExample } from './meta.js';

const lifecycleText = ref('未创建');
const pluginNamesText = ref('未安装');
const pickSupportText = ref('未知');
const targetText = ref('等待 Viewer 初始化');
const errorText = ref('');

const runtime = useExampleRuntime<QuickStartDemoSession>({
  beforeMount: resetReadouts,
  createSession: (element) => mountQuickStartDemo(element),
  onError: (error) => {
    errorText.value = getErrorMessage(error);
  },
  onSessionMounted: (session) => {
    lifecycleText.value = session.plus.disposed ? '已释放' : '运行中';
    pluginNamesText.value = session.plus.pluginNames.join(', ') || '无';
    pickSupportText.value = session.plus.coordinates.canWatchMouse ? '支持' : '不支持';
    targetText.value = formatTarget(session.target);
    errorText.value = '';
  },
  onSessionReleased: () => {
    lifecycleText.value = '已释放';
    pluginNamesText.value = '已清空';
    pickSupportText.value = '未知';
    targetText.value = 'Viewer 已销毁';
  },
});

const { isRunning, rebuild, release, runCount, viewerElement } = runtime;
const runText = computed(() => (isRunning.value ? `第 ${runCount.value} 次运行` : '已释放'));

function resetReadouts(): void {
  lifecycleText.value = '启动中';
  pluginNamesText.value = '未安装';
  pickSupportText.value = '未知';
  targetText.value = '等待 Viewer 初始化';
  errorText.value = '';
}
</script>

<template>
  <ExamplePageShell :example="quickStartExample">
    <template #viewer>
      <div ref="viewerElement" class="example-viewer"></div>
    </template>

    <template #sidebar>
      <section class="inspector-section">
        <h3>运行状态</h3>
        <div class="metric-list">
          <div class="metric-row">
            <span class="metric-label">运行次数</span>
            <strong class="metric-value">{{ runText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">生命周期</span>
            <strong class="metric-value">{{ lifecycleText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">目标位置</span>
            <strong class="metric-value">{{ targetText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">插件列表</span>
            <strong class="metric-value">{{ pluginNamesText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">PickPosition</span>
            <strong class="metric-value">{{ pickSupportText }}</strong>
          </div>
        </div>
      </section>

      <section class="inspector-section">
        <h3>当前操作</h3>
        <div class="action-row">
          <button class="example-button" type="button" @click="rebuild">重建 Viewer</button>
          <button class="example-button" type="button" :disabled="!isRunning" @click="release">
            释放资源
          </button>
        </div>
      </section>

      <section class="inspector-section">
        <h3>说明</h3>
        <p class="note-text">Viewer 由宿主页面创建和销毁，Cesium Plus 只绑定它。</p>
        <p class="note-text">这个示例故意不安装插件，`pluginNames` 应该保持为空。</p>
        <p class="note-text">
          重建按钮会重新走完整生命周期，验证 `create(viewer)` 和 `dispose()`。
        </p>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </section>
    </template>
  </ExamplePageShell>
</template>

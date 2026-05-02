<script setup lang="ts">
import { computed, ref } from 'vue';

import ExamplePageShell from '../../components/ExamplePageShell.vue';
import { getErrorMessage } from '../shared/cesium.js';
import { useExampleRuntime } from '../shared/useExampleRuntime.js';
import { mountPluginBasicDemo, type PluginBasicDemoSession } from './demo.js';
import { pluginBasicExample } from './meta.js';

const cleanupLogText = ref('等待下一次释放');
const errorText = ref('');
const installSummaryText = ref('等待插件安装');
const lifecycleText = ref('未创建');
const pluginNamesText = ref('未安装');
const sceneStatusText = ref('等待插件安装');

const runtime = useExampleRuntime<PluginBasicDemoSession>({
  beforeMount: resetReadouts,
  createSession: (element) =>
    mountPluginBasicDemo(element, {
      onCleanupChange: (logs) => {
        cleanupLogText.value = logs.length > 0 ? logs.join(' -> ') : '等待下一次释放';
      },
      onSceneStatusChange: (text) => {
        sceneStatusText.value = text;
      },
    }),
  onError: (error) => {
    errorText.value = getErrorMessage(error);
  },
  onSessionMounted: (session) => {
    lifecycleText.value = '运行中';
    pluginNamesText.value = session.plus.pluginNames.join(', ') || '无';
    installSummaryText.value = `尝试安装 ${session.attemptedInstallCount} 次，实际安装 ${session.plus.pluginNames.length} 个插件。`;
    errorText.value = '';
  },
  onSessionReleased: () => {
    lifecycleText.value = '已释放';
    pluginNamesText.value = '已清空';
    sceneStatusText.value = '插件已卸载';
    if (cleanupLogText.value === '等待下一次释放') {
      cleanupLogText.value = '未记录';
    }
  },
});

const { isRunning, rebuild, release, runCount, viewerElement } = runtime;
const runText = computed(() => (isRunning.value ? `第 ${runCount.value} 次运行` : '已释放'));

function resetReadouts(): void {
  cleanupLogText.value = '等待下一次释放';
  errorText.value = '';
  installSummaryText.value = '等待插件安装';
  lifecycleText.value = '启动中';
  pluginNamesText.value = '未安装';
  sceneStatusText.value = '等待插件安装';
}
</script>

<template>
  <ExamplePageShell :example="pluginBasicExample">
    <template #viewer>
      <div ref="viewerElement" class="example-viewer"></div>
    </template>

    <template #sidebar>
      <section class="inspector-section">
        <h3>插件状态</h3>
        <div class="metric-list">
          <div class="metric-row">
            <span class="metric-label">运行次数</span>
            <strong class="metric-value">{{ runText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">插件列表</span>
            <strong class="metric-value">{{ pluginNamesText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">安装结果</span>
            <strong class="metric-value">{{ installSummaryText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">场景状态</span>
            <strong class="metric-value">{{ sceneStatusText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">生命周期</span>
            <strong class="metric-value">{{ lifecycleText }}</strong>
          </div>
          <div class="metric-row">
            <span class="metric-label">释放顺序</span>
            <strong class="metric-value">{{ cleanupLogText }}</strong>
          </div>
        </div>
      </section>

      <section class="inspector-section">
        <h3>当前操作</h3>
        <div class="action-row">
          <button class="example-button" type="button" @click="rebuild">重建示例</button>
          <button class="example-button" type="button" :disabled="!isRunning" @click="release">
            释放插件
          </button>
        </div>
      </section>

      <section class="inspector-section">
        <h3>说明</h3>
        <p class="note-text">这个页面一次安装两个插件，并故意重复安装 `marker-overlay`。</p>
        <p class="note-text">释放时日志应显示 `marker-overlay -> scene-status`，验证逆序清理。</p>
        <p class="note-text">插件效果和清理顺序都在当前页面可见，不混入其他模块。</p>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </section>
    </template>
  </ExamplePageShell>
</template>

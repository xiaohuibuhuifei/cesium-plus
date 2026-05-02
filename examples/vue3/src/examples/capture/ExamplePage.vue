<script setup lang="ts">
import { computed, ref } from 'vue';

import ExamplePageShell from '../../components/ExamplePageShell.vue';
import { formatTarget, getErrorMessage } from '../shared/cesium.js';
import { useExampleRuntime } from '../shared/useExampleRuntime.js';
import { mountCaptureDemo, type CaptureDemoSession } from './demo.js';
import { captureExample } from './meta.js';

const detailText = ref('等待 Viewer 初始化');
const errorText = ref('');
const lifecycleText = ref('未创建');
const screenshotDataUrl = ref('');
const screenshotSizeText = ref('未生成');

const runtime = useExampleRuntime<CaptureDemoSession>({
  beforeMount: resetReadouts,
  createSession: (element) => mountCaptureDemo(element),
  onError: (error) => {
    errorText.value = getErrorMessage(error);
  },
  onSessionMounted: (session) => {
    lifecycleText.value = '运行中';
    detailText.value = `目标：${formatTarget(session.target)}`;
    errorText.value = '';
  },
  onSessionReleased: () => {
    lifecycleText.value = '已释放';
    detailText.value = 'Viewer 已销毁';
    screenshotDataUrl.value = '';
    screenshotSizeText.value = '未生成';
  },
});

const { isRunning, rebuild, release, runCount, session, viewerElement } = runtime;
const canCapture = computed(() => session.value !== undefined);
const runText = computed(() => (isRunning.value ? `第 ${runCount.value} 次运行` : '已释放'));

async function takeScreenshot(): Promise<void> {
  const activeSession = session.value;

  if (!activeSession) {
    errorText.value = 'capture 不可用。';
    return;
  }

  try {
    screenshotSizeText.value = '生成中';
    const dataUrl = await activeSession.takeScreenshot();
    screenshotDataUrl.value = dataUrl;
    screenshotSizeText.value = `${dataUrl.length.toLocaleString()} 字符`;
    errorText.value = '';
  } catch (error) {
    screenshotSizeText.value = '生成失败';
    errorText.value = getErrorMessage(error);
  }
}

async function downloadScreenshot(): Promise<void> {
  const activeSession = session.value;

  if (!activeSession) {
    errorText.value = 'capture 不可用。';
    return;
  }

  try {
    screenshotSizeText.value = '下载中';
    const dataUrl = await activeSession.downloadScreenshot();
    screenshotDataUrl.value = dataUrl;
    screenshotSizeText.value = `${dataUrl.length.toLocaleString()} 字符`;
    errorText.value = '';
  } catch (error) {
    screenshotSizeText.value = '下载失败';
    errorText.value = getErrorMessage(error);
  }
}

function resetReadouts(): void {
  detailText.value = '等待 Viewer 初始化';
  errorText.value = '';
  lifecycleText.value = '启动中';
  screenshotDataUrl.value = '';
  screenshotSizeText.value = '未生成';
}
</script>

<template>
  <ExamplePageShell :example="captureExample">
    <template #viewer>
      <div ref="viewerElement" class="example-viewer"></div>
    </template>

    <template #sidebar>
      <section class="inspector-section">
        <h3>截图状态</h3>
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
            <span class="metric-label">输出结果</span>
            <strong class="metric-value">{{ screenshotSizeText }}</strong>
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
          <button
            class="example-button"
            type="button"
            :disabled="!canCapture"
            @click="takeScreenshot"
          >
            生成截图
          </button>
          <button
            class="example-button"
            type="button"
            :disabled="!canCapture"
            @click="downloadScreenshot"
          >
            下载截图
          </button>
          <button class="example-button" type="button" @click="rebuild">重建 Viewer</button>
          <button class="example-button" type="button" :disabled="!isRunning" @click="release">
            释放资源
          </button>
        </div>
      </section>

      <section class="inspector-section">
        <h3>截图预览</h3>
        <p class="note-text">截图面板直接展示这次调用返回的 data URL。</p>
        <img
          v-if="screenshotDataUrl"
          class="preview-image"
          :src="screenshotDataUrl"
          alt="Cesium canvas screenshot preview"
        />
        <p v-else class="note-text">先生成截图，再看预览和下载结果。</p>
        <p v-if="errorText" class="error-text">{{ errorText }}</p>
      </section>
    </template>
  </ExamplePageShell>
</template>

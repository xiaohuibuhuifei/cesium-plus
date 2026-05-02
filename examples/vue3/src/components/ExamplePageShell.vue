<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { ExampleMeta } from '../examples/types.js';

defineProps<{
  example: ExampleMeta;
}>();
</script>

<template>
  <article class="example-page">
    <header class="example-topbar">
      <div class="title-block">
        <h2>{{ example.title }}</h2>
      </div>
      <RouterLink to="/" class="back-link">返回首页</RouterLink>
    </header>

    <div class="example-body">
      <div class="example-stage">
        <slot name="viewer" />
      </div>

      <aside class="example-sidebar">
        <section class="sidebar-summary">
          <p class="example-route">#/examples/{{ example.slug }}</p>
          <p class="example-summary">{{ example.summary }}</p>
          <div class="tag-row">
            <span v-for="tag in example.tags" :key="tag" class="tag-chip">{{ tag }}</span>
          </div>
        </section>
        <slot name="sidebar" />
      </aside>
    </div>
  </article>
</template>

<style scoped>
.example-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 100dvh;
  background: #f5f5f4;
}

.example-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 0 24px;
  border-bottom: 1px solid #d6d3d1;
  background: #ffffff;
}

.title-block {
  display: grid;
  gap: 4px;
}

.title-block h2 {
  margin: 0;
  color: #1c1917;
  font-size: 24px;
  line-height: 1.2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  color: #1c1917;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.back-link:hover {
  border-color: #0f766e;
  color: #0f766e;
}

.example-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  min-height: 0;
  height: calc(100dvh - 73px);
}

.example-stage {
  min-width: 0;
  min-height: 0;
  border-right: 1px solid #d6d3d1;
  background: #0f172a;
}

.example-sidebar {
  overflow: auto;
  background: #ffffff;
}

.sidebar-summary {
  display: grid;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid #e7e5e4;
  background: #fafaf9;
}

.example-route {
  margin: 0;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
}

.example-summary {
  margin: 0;
  color: #57534e;
  font-size: 14px;
  line-height: 1.6;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  padding: 6px 10px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  color: #1c1917;
  font-size: 12px;
  font-weight: 700;
}

:deep(.example-viewer) {
  height: 100%;
  min-height: 100%;
  width: 100%;
}

:deep(.inspector-section) {
  padding: 18px 20px;
  border-bottom: 1px solid #e7e5e4;
}

:deep(.inspector-section:last-child) {
  border-bottom: 0;
}

:deep(.inspector-section h3) {
  margin: 0 0 14px;
  color: #1c1917;
  font-size: 15px;
}

:deep(.metric-list) {
  display: grid;
  gap: 14px;
}

:deep(.metric-row) {
  display: grid;
  gap: 4px;
}

:deep(.metric-label) {
  color: #78716c;
  font-size: 12px;
  font-weight: 700;
}

:deep(.metric-value) {
  color: #1c1917;
  font-size: 14px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

:deep(.action-row) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

:deep(.action-row > .example-button:nth-child(n + 3)) {
  grid-column: span 2;
}

:deep(.example-button) {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #a8a29e;
  background: #ffffff;
  color: #1c1917;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

:deep(.example-button:hover:not(:disabled)) {
  border-color: #0f766e;
  color: #0f766e;
}

:deep(.example-button:disabled) {
  cursor: not-allowed;
  opacity: 0.45;
}

:deep(.note-text) {
  margin: 0 0 10px;
  color: #57534e;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.note-text:last-of-type) {
  margin-bottom: 0;
}

:deep(.error-text) {
  margin: 12px 0 0;
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.preview-image) {
  display: block;
  width: 100%;
  border: 1px solid #d6d3d1;
  background: #fafaf9;
}

@media (max-width: 720px) {
  .example-topbar {
    min-height: 64px;
    padding-right: 16px;
    padding-left: 16px;
  }

  .title-block h2 {
    font-size: 20px;
  }

  .example-body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(360px, 55dvh) auto;
    height: auto;
    min-height: calc(100dvh - 65px);
  }

  .example-stage {
    border-right: 0;
    border-bottom: 1px solid #d6d3d1;
  }

  .sidebar-summary,
  :deep(.inspector-section) {
    padding-right: 16px;
    padding-left: 16px;
  }

  :deep(.action-row) {
    grid-template-columns: 1fr;
  }

  :deep(.action-row > .example-button:nth-child(n + 3)) {
    grid-column: auto;
  }
}
</style>

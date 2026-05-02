<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { exampleCatalog, getExamplePath, normalizeExampleTag } from '../examples/catalog.js';

const route = useRoute();

const activeTag = computed(() => normalizeExampleTag(route.query.tag));
const filteredExamples = computed(() => {
  if (!activeTag.value) {
    return exampleCatalog;
  }

  return exampleCatalog.filter((example) => example.tags.includes(activeTag.value!));
});
</script>

<template>
  <section class="catalog-page">
    <div v-if="filteredExamples.length > 0" class="catalog-grid">
      <RouterLink
        v-for="example in filteredExamples"
        :key="example.slug"
        :to="getExamplePath(example.slug)"
        class="catalog-card"
      >
        <div class="catalog-card-main">
          <p class="catalog-route">#/examples/{{ example.slug }}</p>
          <div class="catalog-copy">
            <strong>{{ example.title }}</strong>
            <p>{{ example.summary }}</p>
          </div>
        </div>
        <div class="catalog-card-footer">
          <div class="catalog-tags">
            <span v-for="tag in example.tags" :key="tag">{{ tag }}</span>
          </div>
          <span class="catalog-cta">查看示例</span>
        </div>
      </RouterLink>
    </div>

    <section v-else class="empty-state">
      <h2>没有匹配的示例</h2>
      <p>当前筛选条件下没有入口卡片，切回“全部”即可恢复完整列表。</p>
    </section>
  </section>
</template>

<style scoped>
.catalog-page {
  min-height: calc(100dvh - 164px);
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.catalog-card {
  display: grid;
  gap: 20px;
  min-height: 220px;
  padding: 22px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  color: inherit;
  text-decoration: none;
}

.catalog-card:hover {
  border-color: #0f766e;
  background: #fafaf9;
}

.catalog-card-main,
.catalog-copy,
.catalog-card-footer {
  display: grid;
}

.catalog-card-main,
.catalog-copy {
  gap: 10px;
}

.catalog-card-footer {
  gap: 14px;
  align-content: end;
}

.catalog-route {
  margin: 0;
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
}

.catalog-copy strong {
  font-size: 18px;
  line-height: 1.2;
}

.catalog-copy p {
  margin: 0;
  color: #57534e;
  font-size: 14px;
  line-height: 1.6;
}

.catalog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog-tags span,
.catalog-cta {
  font-size: 12px;
  font-weight: 700;
}

.catalog-tags span {
  padding: 6px 10px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  color: #1c1917;
}

.catalog-cta {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  width: fit-content;
  padding: 0 12px;
  border: 1px solid #0f766e;
  background: #ffffff;
  color: #0f766e;
}

.empty-state {
  display: grid;
  gap: 10px;
  padding: 28px 24px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
}

.empty-state h2 {
  margin: 0;
  color: #1c1917;
  font-size: 20px;
}

.empty-state p {
  margin: 0;
  color: #57534e;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .catalog-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .catalog-card,
  .empty-state {
    padding: 18px 16px;
  }
}
</style>

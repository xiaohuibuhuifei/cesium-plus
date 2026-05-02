<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import { exampleTags, normalizeExampleTag } from './examples/catalog.js';

const route = useRoute();

const isCatalogRoute = computed(() => route.name === 'catalog');
const activeTag = computed(() => normalizeExampleTag(route.query.tag));
</script>

<template>
  <div v-if="isCatalogRoute" class="catalog-shell">
    <header class="catalog-topbar">
      <div class="catalog-titles">
        <p class="catalog-eyebrow">Cesium Plus</p>
        <h1>Examples</h1>
      </div>

      <nav class="catalog-filters" aria-label="快捷条件筛选">
        <RouterLink
          :to="{ name: 'catalog' }"
          class="filter-chip"
          :class="{ active: activeTag === undefined }"
        >
          全部
        </RouterLink>
        <RouterLink
          v-for="tag in exampleTags"
          :key="tag"
          :to="{ name: 'catalog', query: { tag } }"
          class="filter-chip"
          :class="{ active: activeTag === tag }"
        >
          {{ tag }}
        </RouterLink>
      </nav>
    </header>

    <main class="catalog-content">
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
</template>

<style scoped>
.catalog-shell {
  min-height: 100%;
}

.catalog-topbar {
  display: grid;
  gap: 18px;
  padding: 28px 32px 20px;
  border-bottom: 1px solid #d6d3d1;
  background: #ffffff;
}

.catalog-titles {
  display: grid;
  gap: 6px;
}

.catalog-eyebrow {
  margin: 0;
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
}

.catalog-titles h1 {
  margin: 0;
  color: #1c1917;
  font-size: 32px;
  line-height: 1;
}

.catalog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #d6d3d1;
  background: #ffffff;
  color: #292524;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.filter-chip:hover {
  border-color: #0f766e;
  color: #0f766e;
}

.filter-chip.active {
  border-color: #0f766e;
  background: #ccfbf1;
  color: #134e4a;
}

.catalog-content {
  padding: 24px 32px 32px;
}

@media (max-width: 980px) {
  .catalog-topbar,
  .catalog-content {
    padding: 16px;
  }
}
</style>

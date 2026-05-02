import { createRouter, createWebHashHistory } from 'vue-router';

import { getExamplePath } from './examples/catalog.js';
import CaptureExamplePage from './examples/capture/ExamplePage.vue';
import CoordinatesExamplePage from './examples/coordinates/ExamplePage.vue';
import PluginBasicExamplePage from './examples/plugin-basic/ExamplePage.vue';
import QuickStartExamplePage from './examples/quick-start/ExamplePage.vue';
import ExampleCatalogPage from './pages/ExampleCatalogPage.vue';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      component: ExampleCatalogPage,
      name: 'catalog',
      path: '/',
    },
    {
      component: QuickStartExamplePage,
      name: 'quick-start',
      path: getExamplePath('quick-start'),
    },
    {
      component: CoordinatesExamplePage,
      name: 'coordinates',
      path: getExamplePath('coordinates'),
    },
    {
      component: CaptureExamplePage,
      name: 'capture',
      path: getExamplePath('capture'),
    },
    {
      component: PluginBasicExamplePage,
      name: 'plugin-basic',
      path: getExamplePath('plugin-basic'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior() {
    return {
      top: 0,
    };
  },
});

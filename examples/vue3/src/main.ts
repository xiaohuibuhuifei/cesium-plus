// Cesium 的 Widget 样式由宿主应用显式引入，增强库不替应用做决定。
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { createApp } from 'vue';

import App from './App.vue';
import './style.css';

createApp(App).mount('#app');

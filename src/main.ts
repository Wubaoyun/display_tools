import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import BlogView from './views/BlogView.vue'
import BaseConverterView from './tools/base-converter/BaseConverterView.vue'
import ScientificCalculatorView from './tools/scientific-calculator/ScientificCalculatorView.vue'
import ImageGeneratorView from './tools/image-generator/ImageGeneratorView.vue'
import GammaCurveLookupView from './tools/gamma-curve-lookup/GammaCurveLookupView.vue'
import './styles.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/blog', component: BlogView },
    { path: '/tools/base-converter', component: BaseConverterView },
    { path: '/tools/scientific-calculator', component: ScientificCalculatorView },
    { path: '/tools/image-generator', component: ImageGeneratorView },
    { path: '/tools/gamma-curve-lookup', component: GammaCurveLookupView },
  ],
})

createApp(App).use(router).mount('#app')

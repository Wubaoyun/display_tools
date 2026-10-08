<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">D</span>
        <span>
          <strong>Display Tools</strong>
          <small>OLED 工程师工具库</small>
        </span>
      </RouterLink>
      <nav class="site-nav" aria-label="主导航">
        <RouterLink to="/">工具中心</RouterLink>
        <RouterLink to="/blog">技术博客</RouterLink>
      </nav>
    </header>

    <main class="site-main">
      <RouterView />
    </main>

    <footer class="site-footer">
      <span>Display Tools</span>
      <span>面向显示模组工程实践，持续建设中</span>
    </footer>
  </div>
</template>

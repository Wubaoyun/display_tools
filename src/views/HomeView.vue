<script setup lang="ts">
import { computed, ref } from 'vue'
import { toolDefinitions, type ToolCategory } from '../domain/tools'

const search = ref('')
const selectedCategory = ref<ToolCategory | '全部'>('全部')

const categories = computed(() => [
  '全部',
  ...Array.from(new Set(toolDefinitions.map((tool) => tool.category))),
] as const)

const filteredTools = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  const categoryOrder: ToolCategory[] = ['基础计算', '图像处理', '设置速查', '显示工程']
  return toolDefinitions.filter((tool) => {
    const matchesCategory =
      selectedCategory.value === '全部' || tool.category === selectedCategory.value
    const matchesKeyword =
      !keyword ||
      `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(keyword)
    return matchesCategory && matchesKeyword
  }).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
})
</script>

<template>
  <section class="hero">
    <p class="eyebrow">ENGINEERING TOOLBOX</p>
    <h1>把常用的显示工程工具，<span>放在一个地方。</span></h1>
    <p class="hero-copy">
      从日常计算、图片处理，到 OLED 显示模组调试工具，逐步沉淀为可分享、可复用的工程知识库。
    </p>
    <div class="hero-meta">
      <span class="status-dot"></span>
      <span>{{ toolDefinitions.length }} 个工具已规划</span>
      <span class="meta-separator">·</span>
      <span>支持持续扩展</span>
    </div>
  </section>

  <section class="tool-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">TOOLS</p>
        <h2>工具中心</h2>
      </div>
      <label class="search-box">
        <span aria-hidden="true">⌕</span>
        <input v-model="search" type="search" placeholder="搜索工具..." />
      </label>
    </div>

    <div class="category-tabs" role="tablist" aria-label="工具分类">
      <button
        v-for="category in categories"
        :key="category"
        :class="{ active: selectedCategory === category }"
        type="button"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <div class="tool-grid">
      <article v-for="tool in filteredTools" :key="tool.id" class="tool-card">
        <div class="tool-card-top">
          <span class="tool-icon">{{ tool.category === '图像处理' ? '▧' : tool.category === '设置速查' ? '⌁' : '⌘' }}</span>
          <span class="tool-status">{{ tool.version ?? '即将上线' }}</span>
        </div>
        <p class="tool-category">{{ tool.category }}</p>
        <h3>{{ tool.name }}</h3>
        <p>{{ tool.description }}</p>
        <RouterLink v-if="tool.path" class="text-button" :to="tool.path">打开工具 <span>→</span></RouterLink>
        <button v-else class="text-button" type="button" disabled>准备中 <span>→</span></button>
      </article>
    </div>

    <p v-if="filteredTools.length === 0" class="empty-state">没有找到匹配的工具。</p>
  </section>
</template>

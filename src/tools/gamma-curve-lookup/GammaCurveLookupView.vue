<script setup lang="ts">
import { computed, ref } from 'vue'

type Point = { x: number; y: number }
type BrightnessNode = { id: number; nit: number; remappingEnabled: boolean; remappingGray: number }
type NodeCurve = { id: number; node: number; color: string; points: Point[] }
type MeasurementResult = {
  id: number
  node: number
  color: string
  before: number | null
  after: number | null
  beforeStatus?: string
  afterStatus?: string
}

const gamma = ref(2.2)
const nextNodeId = ref(6)
const nodes = ref<BrightnessNode[]>([2, 10, 90, 500, 1000].map((nit, index) => ({
  id: index + 1,
  nit,
  remappingEnabled: false,
  remappingGray: 239,
})))
const measuredNit = ref(1)
const measuredGray = ref(128)
const maxGray = 255
const chartWidth = 860
const chartHeight = 520
const padding = { left: 76, right: 28, top: 28, bottom: 58 }
const plotWidth = chartWidth - padding.left - padding.right
const plotHeight = chartHeight - padding.top - padding.bottom
const colors = ['#6ee7d2', '#f2c879', '#8bb8ff', '#e89bea', '#ff8c8c', '#a6d981', '#f5a86b', '#8ed1e0']

const validNodes = computed(() => nodes.value
  .map((entry, index) => ({ ...entry, nit: Number(entry.nit), index }))
  .filter(({ nit }) => Number.isFinite(nit) && nit > 0)
  .sort((a, b) => a.nit - b.nit || a.index - b.index)
  .map(({ index, ...entry }) => ({ ...entry, color: colors[index % colors.length] })))
const gammaValue = computed(() => Math.max(0, Math.min(5, Number(gamma.value) || 0)))
const measuredNitValue = computed(() => Math.max(0, Number(measuredNit.value) || 0))
const measuredGrayValue = computed(() => Math.max(0, Math.min(maxGray, Number(measuredGray.value) || 0)))
const x = (gray: number) => padding.left + (gray / maxGray) * plotWidth
const luminanceAtGray = (node: BrightnessNode, gray: number, remapped: boolean) => {
  const referenceGray = remapped && node.remappingEnabled ? node.remappingGray : maxGray
  return node.nit * Math.pow(gray / referenceGray, gammaValue.value)
}
const maxNit = computed(() => Math.max(
  1,
  ...validNodes.value.map((node) => luminanceAtGray(node, maxGray, true)),
))
const y = (nit: number) => padding.top + plotHeight - (nit / maxNit.value) * plotHeight

function curvePoints(node: BrightnessNode, remapped: boolean): Point[] {
  return Array.from({ length: 65 }, (_, index) => {
    const gray = index * 4 - (index === 64 ? 1 : 0)
    return { x: x(gray), y: y(luminanceAtGray(node, gray, remapped)) }
  })
}

const baselineCurves = computed<NodeCurve[]>(() => validNodes.value
  .filter((node) => node.remappingEnabled)
  .map((node) => ({ id: node.id, node: node.nit, color: node.color, points: curvePoints(node, false) })))
const curves = computed<NodeCurve[]>(() => validNodes.value
  .map((node) => ({ id: node.id, node: node.nit, color: node.color, points: curvePoints(node, true) })))

function grayForBrightness(node: BrightnessNode, brightness: number, remapped: boolean) {
  if (gammaValue.value === 0) {
    return brightness === node.nit
      ? { value: null, status: '任意灰阶（Gamma = 0）' }
      : { value: null, status: '无交点（Gamma = 0）' }
  }
  const referenceGray = remapped && node.remappingEnabled ? node.remappingGray : maxGray
  const gray = referenceGray * Math.pow(brightness / node.nit, 1 / gammaValue.value)
  return gray <= maxGray
    ? { value: gray }
    : { value: null, status: '超出 255 灰阶' }
}

const measuredLuminanceResults = computed<MeasurementResult[]>(() => validNodes.value.map((entry) => {
  const before = grayForBrightness(entry, measuredNitValue.value, false)
  const after = grayForBrightness(entry, measuredNitValue.value, true)
  return {
    id: entry.id,
    node: entry.nit,
    color: entry.color,
    before: before.value,
    after: after.value,
    beforeStatus: before.status,
    afterStatus: after.status,
  }
}))

const measuredGrayResults = computed<MeasurementResult[]>(() => validNodes.value.map((entry) => ({
  id: entry.id,
  node: entry.nit,
  color: entry.color,
  before: luminanceAtGray(entry, measuredGrayValue.value, false),
  after: luminanceAtGray(entry, measuredGrayValue.value, true),
})))

const showMeasuredNitLine = computed(() => measuredNitValue.value <= maxNit.value)
const path = (points: Point[]) => points
  .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
  .join(' ')
const xTicks = [0, 64, 128, 192, 255]
const yTicks = computed(() => Array.from({ length: 6 }, (_, index) => maxNit.value * index / 5))

function addNode() {
  if (nodes.value.length >= 20) return
  const last = nodes.value[nodes.value.length - 1]?.nit || 100
  nodes.value.push({ id: nextNodeId.value++, nit: Math.max(1, Math.round(last * 2)), remappingEnabled: false, remappingGray: 239 })
}

function removeNode(index: number) {
  nodes.value.splice(index, 1)
}

function setNodeNit(node: BrightnessNode, value: string) {
  node.nit = Math.max(0, Number(value) || 0)
}

function setRemappingGray(node: BrightnessNode, value: string) {
  node.remappingGray = Math.max(1, Math.min(maxGray, Number(value) || 1))
}

function setGamma(value: string) {
  gamma.value = Math.max(0, Math.min(5, Number(value) || 0))
}

function setMeasuredNit(value: string) {
  measuredNit.value = Math.max(0, Number(value) || 0)
}

function setMeasuredGray(value: string) {
  measuredGray.value = Math.max(0, Math.min(maxGray, Number(value) || 0))
}

</script>

<template>
  <section class="tool-page dmr-page">
    <RouterLink class="back-link" to="/">← 返回工具中心</RouterLink>
    <div class="tool-page-header">
      <p class="eyebrow">SETTING QUICK REFERENCE</p>
      <h1>Gamma曲线<span>速查</span></h1>
      <p>设置不同绝对亮度节点和 Gamma，查看灰阶到亮度的曲线，并通过测量亮度或灰阶查询节点交点。</p>
    </div>

    <div class="dmr-layout">
      <div class="dmr-controls">
        <label class="dmr-field-label">Gamma（0–5）
          <input :value="gamma" type="number" min="0" max="5" step="0.1" @input="setGamma(($event.target as HTMLInputElement).value)" />
        </label>
        <div class="dmr-node-heading">
          <span>亮度节点（nit）</span>
          <small>{{ nodes.length }} / 20</small>
        </div>
        <div class="dmr-node-list">
          <div v-for="(node, index) in nodes" :key="node.id" class="dmr-node-entry">
            <div class="dmr-node-row">
              <span>{{ index + 1 }}</span>
              <input :value="node.nit" type="number" min="0" step="0.1" :aria-label="`亮度节点 ${index + 1}（nit）`" @input="setNodeNit(node, ($event.target as HTMLInputElement).value)" />
              <button type="button" aria-label="删除亮度节点" @click="removeNode(index)">×</button>
            </div>
            <div class="dmr-remapping-row">
              <label class="dmr-remapping-toggle">
                <input v-model="node.remappingEnabled" type="checkbox" />
                <span>Remapping</span>
              </label>
              <label v-if="node.remappingEnabled" class="dmr-remapping-gray">
                灰阶
                <input :value="node.remappingGray" type="number" min="1" max="255" step="1" :aria-label="`节点 ${index + 1} Remapping 灰阶`" @input="setRemappingGray(node, ($event.target as HTMLInputElement).value)" />
              </label>
            </div>
          </div>
        </div>
        <p class="dmr-help">节点数量可设置为 0–20 个。节点值为 0 时不会参与曲线计算。</p>
        <button class="secondary-button dmr-add-button" type="button" :disabled="nodes.length >= 20" @click="addNode">+ 添加亮度节点</button>
      </div>

      <div class="dmr-chart-card">
        <div class="preview-header">
          <span>Gamma 曲线</span>
          <small>横轴：灰阶；纵轴：绝对亮度（nit）</small>
        </div>
        <div class="dmr-chart-wrap">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" role="img" aria-label="Gamma曲线速查图">
            <rect class="dmr-chart-background" x="0" y="0" :width="chartWidth" :height="chartHeight" />
            <g v-for="tick in yTicks" :key="`y-${tick}`">
              <line class="dmr-grid-line" :x1="padding.left" :x2="chartWidth - padding.right" :y1="y(tick)" :y2="y(tick)" />
              <text class="dmr-axis-label" :x="padding.left - 10" :y="y(tick) + 4" text-anchor="end">{{ tick.toFixed(0) }}</text>
            </g>
            <g v-for="tick in xTicks" :key="`x-${tick}`">
              <line class="dmr-grid-line" :x1="x(tick)" :x2="x(tick)" :y1="padding.top" :y2="chartHeight - padding.bottom" />
              <text class="dmr-axis-label" :x="x(tick)" :y="chartHeight - padding.bottom + 22" text-anchor="middle">{{ tick }}</text>
            </g>
            <line class="dmr-axis" :x1="padding.left" :x2="padding.left" :y1="padding.top" :y2="chartHeight - padding.bottom" />
            <line class="dmr-axis" :x1="padding.left" :x2="chartWidth - padding.right" :y1="chartHeight - padding.bottom" :y2="chartHeight - padding.bottom" />
            <line v-if="showMeasuredNitLine" class="dmr-measurement-nit-line" :x1="padding.left" :x2="chartWidth - padding.right" :y1="y(measuredNitValue)" :y2="y(measuredNitValue)" />
            <line class="dmr-measurement-gray-line" :x1="x(measuredGrayValue)" :x2="x(measuredGrayValue)" :y1="padding.top" :y2="chartHeight - padding.bottom" />
            <path v-for="curve in baselineCurves" :key="`baseline-${curve.id}`" class="dmr-gamma-curve dmr-gamma-baseline" :stroke="curve.color" :d="path(curve.points)" />
            <path v-for="curve in curves" :key="`curve-${curve.id}`" class="dmr-gamma-curve" :stroke="curve.color" :d="path(curve.points)" />
            <g v-for="result in measuredLuminanceResults" :key="`measure-nit-${result.id}`">
              <circle v-if="result.before !== null && nodes.find((node) => node.id === result.id)?.remappingEnabled" class="dmr-intersection-before" :cx="x(result.before)" :cy="y(measuredNitValue)" :stroke="result.color" r="4" />
              <circle v-if="result.after !== null" class="dmr-intersection-point" :cx="x(result.after)" :cy="y(measuredNitValue)" :fill="result.color" r="4" />
            </g>
            <g v-for="result in measuredGrayResults" :key="`measure-gray-${result.id}`">
              <circle v-if="nodes.find((node) => node.id === result.id)?.remappingEnabled" class="dmr-intersection-before" :cx="x(measuredGrayValue)" :cy="y(result.before ?? 0)" :stroke="result.color" r="4" />
              <circle class="dmr-intersection-point" :cx="x(measuredGrayValue)" :cy="y(result.after ?? 0)" :fill="result.color" r="4" />
            </g>
            <text class="dmr-axis-title" :x="chartWidth / 2" :y="chartHeight - 8" text-anchor="middle">灰阶（0–255）</text>
            <text class="dmr-axis-title" :transform="`translate(15 ${chartHeight / 2}) rotate(-90)`" text-anchor="middle">绝对亮度（nit）</text>
          </svg>
        </div>

        <div class="dmr-measurement-controls">
          <label>测量亮度（nit）
            <input :value="measuredNit" type="number" min="0" step="0.1" @input="setMeasuredNit(($event.target as HTMLInputElement).value)" />
          </label>
          <label>测量灰阶
            <input :value="measuredGray" type="number" min="0" max="255" step="1" @input="setMeasuredGray(($event.target as HTMLInputElement).value)" />
          </label>
        </div>

        <div class="dmr-results-grid">
          <section class="dmr-result-panel">
            <h3>测量亮度交点：{{ measuredNitValue }} nit → 灰阶</h3>
            <p v-if="measuredNitValue > maxNit" class="dmr-empty-result">测量亮度高于当前最高节点，曲线图中不显示水平测量线。</p>
            <p v-else-if="measuredLuminanceResults.length === 0" class="dmr-empty-result">请添加亮度节点以计算交点。</p>
            <div v-for="result in measuredLuminanceResults" :key="`nit-result-${result.id}`" class="dmr-result-row">
              <span><i :style="{ backgroundColor: result.color }"></i>{{ result.node }} nit 节点</span>
              <div class="dmr-before-after">
                <small>Remapping 前：{{ result.beforeStatus ?? `灰阶 ${result.before?.toFixed(2)}` }}</small>
                <small>Remapping 后：{{ result.afterStatus ?? `灰阶 ${result.after?.toFixed(2)}` }}</small>
              </div>
            </div>
          </section>
          <section class="dmr-result-panel">
            <h3>测量灰阶：{{ measuredGrayValue }} → 绝对亮度</h3>
            <p v-if="measuredGrayResults.length === 0" class="dmr-empty-result">请添加亮度节点以计算对应亮度。</p>
            <div v-for="result in measuredGrayResults" :key="`gray-result-${result.id}`" class="dmr-result-row">
              <span><i :style="{ backgroundColor: result.color }"></i>{{ result.node }} nit 节点</span>
              <div class="dmr-before-after">
                <small>Remapping 前：{{ result.before?.toFixed(2) }} nit</small>
                <small>Remapping 后：{{ result.after?.toFixed(2) }} nit</small>
              </div>
            </div>
          </section>
        </div>
        <p class="dmr-formula">Remapping 关闭时，255 灰阶对应节点亮度；启用后，设置的 Remapping 灰阶对应节点亮度。曲线：L = 节点亮度 ×（灰阶 / 参考灰阶）<sup>Gamma</sup>。</p>
      </div>
    </div>
  </section>
</template>

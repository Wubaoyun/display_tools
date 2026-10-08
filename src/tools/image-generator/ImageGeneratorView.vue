<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { canvasToBmp, drawTestImage, type Channel, type Direction, type ImageOptions, type ImageType, type RGB } from './image-generator'

const canvas = ref<HTMLCanvasElement | null>(null)
const width = ref(1080); const height = ref(1920); const type = ref<ImageType>('solid')
const channel = ref<Channel>('W'); const gray = ref(128); const direction = ref<Direction>('horizontal')
const rangeStart = ref(0); const rangeEnd = ref(255); const rangeStep = ref(1)
const solidBatchEnabled = ref(false)
const aplBatchEnabled = ref(false)
const colorbarRgbStart = ref<RGB>([0, 0, 0]); const colorbarRgbEnd = ref<RGB>([255, 255, 255]); const colorbarRgbStep = ref<RGB>([1, 1, 1])
const colorbarWStart = ref(0); const colorbarWEnd = ref(255); const colorbarWStep = ref(1)
const rgbStart = ref<RGB>([0, 0, 0]); const rgbEnd = ref<RGB>([255, 255, 255])
const aplShape = ref<'circle' | 'rect'>('rect'); const aplSize = ref(50); const aplForeground = ref<RGB>([255, 255, 255]); const aplBackground = ref<RGB>([0, 0, 0])
const checkerSize = ref(32); const checkerBackgroundRgb = ref<RGB>([0, 0, 0]); const checkerForegroundRgb = ref<RGB>([255, 255, 255])
const crosstalkLayout = ref(0); const crosstalkBackground = ref<RGB>([127, 127, 127]); const crosstalkForeground = ref<RGB>([0, 0, 0])
const borderWidth = ref(8); const borderBackground = ref<RGB>([0, 0, 0]); const borderForeground = ref<RGB>([255, 255, 255])
const customScript = ref(`# 受限格式：fill R G B / rect x y w h R G B / circle cx cy radius R G B / border width R G B
fill 0 0 0
border 8 255 255 255`)
const advanced = ref(false); const directoryName = ref('浏览器下载目录'); const directoryHandle = ref<FileSystemDirectoryHandle | null>(null); const error = ref(''); const previewUrl = ref('')

const typeLabels: Record<ImageType, string> = { colorbar: 'Colorbar', solid: '纯色图', gradient: '灰阶过渡图', apl: 'APL图', checkerboard: '棋盘格图', crosstalk: 'Crosstalk图', border: 'Border图', custom: '自定义' }
const previewMaxWidth = 620
const previewMaxHeight = 556
const options = computed<ImageOptions>(() => ({ width: width.value, height: height.value, type: type.value, channel: channel.value, gray: gray.value, direction: direction.value, colorbarStart: rangeStart.value, colorbarEnd: rangeEnd.value, colorbarStep: rangeStep.value, colorbarRgbStart: colorbarRgbStart.value, colorbarRgbEnd: colorbarRgbEnd.value, colorbarRgbStep: colorbarRgbStep.value, colorbarWStart: colorbarWStart.value, colorbarWEnd: colorbarWEnd.value, colorbarWStep: colorbarWStep.value, rgbStart: rgbStart.value, rgbEnd: rgbEnd.value, aplShape: aplShape.value, aplSize: aplSize.value, aplForeground: aplForeground.value, aplBackground: aplBackground.value, checkerSize: checkerSize.value, checkerBackgroundRgb: checkerBackgroundRgb.value, checkerForegroundRgb: checkerForegroundRgb.value, crosstalkLayout: crosstalkLayout.value, crosstalkBackground: crosstalkBackground.value, crosstalkForeground: crosstalkForeground.value, borderWidth: borderWidth.value, borderBackground: borderBackground.value, borderForeground: borderForeground.value, customScript: customScript.value }))
const filename = computed(() => `display-test-${typeLabels[type.value]}-${width.value}x${height.value}.bmp`)
function getPreviewOptions(source: ImageOptions): ImageOptions {
  if (source.type !== 'border' || (source.borderWidth ?? 0) <= 0) return source
  const previewScale = Math.min(previewMaxWidth / source.width, previewMaxHeight / source.height)
  const minimumVisibleWidth = Math.ceil(1 / Math.max(previewScale, 0.01))
  return { ...source, borderWidth: Math.max(source.borderWidth ?? 0, minimumVisibleWidth) }
}
function render() {
  if (!canvas.value) return
  try {
    drawTestImage(canvas.value, getPreviewOptions(options.value))
    previewUrl.value = canvas.value.toDataURL('image/png')
    error.value = ''
  } catch (e) { error.value = e instanceof Error ? e.message : '预览生成失败。' }
}
function values(start: number, end: number, step: number) { const result: number[] = []; const s = Math.max(1, Math.abs(step)); const direction = end >= start ? 1 : -1; for (let n = start; direction > 0 ? n <= end : n >= end; n += direction * s) result.push(n); return result.length ? result : [start] }
function setRgb(target: RGB, index: number, value: number) { target[index] = Math.max(0, Math.min(255, Number(value) || 0)) }
async function chooseDirectory() { const picker = window as Window & { showDirectoryPicker?: (o?: { mode?: 'readwrite' }) => Promise<FileSystemDirectoryHandle> }; if (!picker.showDirectoryPicker) { error.value = '当前浏览器不支持目录选择，将使用默认下载目录。'; return }; try { const handle = await picker.showDirectoryPicker({ mode: 'readwrite' }); directoryHandle.value = handle; directoryName.value = handle.name } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) error.value = '无法访问所选目录，请检查浏览器权限。' } }
async function save(blob: Blob, name: string) { if (directoryHandle.value) { const file = await directoryHandle.value.getFileHandle(name, { create: true }); const writable = await file.createWritable(); await writable.write(blob); await writable.close() } else { const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = name; link.click(); URL.revokeObjectURL(link.href) } }
async function generate() {
  render(); if (!canvas.value) return
  try {
    const batchEnabled = type.value === 'solid'
      ? solidBatchEnabled.value
      : type.value === 'apl' && aplBatchEnabled.value
    const jobs = batchEnabled ? values(rangeStart.value, rangeEnd.value, rangeStep.value) : [undefined]
    for (const value of jobs) {
      const current: ImageOptions = { ...options.value }
      if (type.value === 'solid' && value !== undefined) current.gray = value
      if (type.value === 'apl' && value !== undefined) {
        const base = options.value.aplForeground ?? [255, 255, 255]
        const scale = value / 255
        current.aplForeground = [Math.round(base[0] * scale), Math.round(base[1] * scale), Math.round(base[2] * scale)]
      }
      drawTestImage(canvas.value, current); const suffix = value === undefined ? '' : `-${value}`; await save(canvasToBmp(canvas.value), filename.value.replace('.bmp', `${suffix}.bmp`))
    }
    render()
  } catch (e) { error.value = e instanceof Error ? e.message : '图片生成失败。' }
}
watch(options, () => nextTick(render), { deep: true, immediate: true })
</script>

<template>
  <section class="tool-page image-generator-page">
    <RouterLink class="back-link" to="/">← 返回工具中心</RouterLink>
    <div class="tool-page-header"><p class="eyebrow">IMAGE GENERATOR</p><h1>图片<span>生成器</span></h1><p>为 OLED 显示模组调试生成 RGBW、渐变、Colorbar、Crosstalk 和棋盘格等 BMP 图片，所有处理均在浏览器本地完成。</p></div>
    <div class="image-generator-layout">
      <div class="image-generator-controls">
        <div class="control-grid"><label>宽度（px）<input v-model.number="width" type="number" min="1" max="16384" /></label><label>高度（px）<input v-model.number="height" type="number" min="1" max="16384" /></label></div>
        <label>图片类型<select v-model="type"><option v-for="(label, key) in typeLabels" :key="key" :value="key">{{ label }}</option></select></label>
        <div v-if="type === 'solid'" class="control-grid"><label>通道<select v-model="channel"><option value="R">R 红色</option><option value="G">G 绿色</option><option value="B">B 蓝色</option><option value="W">W 白色</option></select></label><label>灰阶<input v-model.number="gray" type="number" min="0" max="255" /></label></div>
        <div v-if="type === 'colorbar' || type === 'gradient'" class="control-grid"><label>方向<select v-model="direction"><option value="horizontal">H 向</option><option value="vertical">V 向</option><option v-if="type === 'gradient'" value="x">X 向（中心）</option></select></label><template v-if="type === 'gradient'"><label>起始灰阶<input v-model.number="rangeStart" type="number" min="0" max="255" /></label><label>结束灰阶<input v-model.number="rangeEnd" type="number" min="0" max="255" /></label><label>步进<input v-model.number="rangeStep" type="number" min="1" max="255" /></label></template></div>
        <div v-if="type === 'apl'" class="control-grid"><label>形状<select v-model="aplShape"><option value="circle">圆</option><option value="rect">矩形</option></select></label><label>大小（%）<input v-model.number="aplSize" type="number" min="1" max="99" /></label></div>
        <div v-if="type === 'checkerboard'"><label>方格大小（px）<input v-model.number="checkerSize" type="number" min="1" /></label></div>
        <div v-if="type === 'crosstalk'" class="control-grid"><label>方向<select v-model="direction"><option value="horizontal">H 向</option><option value="vertical">V 向</option></select></label><label>{{ direction === 'horizontal' ? '位置（上/中/下）' : '位置（左/中/右）' }}<select v-model.number="crosstalkLayout"><option :value="0">{{ direction === 'horizontal' ? '上' : '左' }}</option><option :value="1">中</option><option :value="2">{{ direction === 'horizontal' ? '下' : '右' }}</option></select></label></div>
        <div v-if="type === 'border'"><label>四边宽度（px）<input v-model.number="borderWidth" type="number" min="0" /></label></div>
        <div v-if="type === 'custom'" class="custom-script-section">
          <label>图片绘制脚本<textarea v-model="customScript" rows="7"></textarea></label>
          <p class="script-help">脚本按从上到下的顺序绘制，每行一条命令；坐标和尺寸单位为像素，颜色使用 0–255 的 R、G、B 值。</p>
          <p class="script-help"><code>fill R G B</code> 填充背景；<code>rect x y width height R G B</code> 绘制矩形；<code>circle cx cy radius R G B</code> 绘制圆；<code>border width R G B</code> 绘制四边框；<code>gradient direction startR startG startB endR endG endB</code> 绘制渐变，direction 为 0 表示 H 向、1 表示 V 向。</p>
          <p class="script-help">示例：<code>fill 0 0 0</code> 加 <code>border 8 255 255 255</code>，表示黑色背景加 8 像素白色边框。</p>
        </div>
        <button v-if="type !== 'custom'" class="secondary-button advanced-toggle" type="button" :aria-expanded="advanced" @click="advanced = !advanced">
          <span class="advanced-icon" aria-hidden="true">{{ advanced ? '−' : '+' }}</span>
          {{ advanced ? '收起高级设置' : '展开高级设置' }}
        </button>
        <div v-if="advanced && type === 'colorbar'" class="advanced-panel">
          <strong>高级设置：各颜色 Bar 起始 / 结束 / 步进</strong>
          <div v-for="(name, i) in ['R', 'G', 'B']" :key="`cb${name}`" class="rgb-row">
            {{ name }}
            <input v-model.number="colorbarRgbStart[i]" aria-label="起始灰阶" type="number" min="0" max="255" />
            <input v-model.number="colorbarRgbEnd[i]" aria-label="终止灰阶" type="number" min="0" max="255" />
            <input v-model.number="colorbarRgbStep[i]" aria-label="灰阶步进" type="number" min="1" max="255" />
          </div>
          <div class="rgb-row">
            W
            <input v-model.number="colorbarWStart" aria-label="W 起始灰阶" type="number" min="0" max="255" />
            <input v-model.number="colorbarWEnd" aria-label="W 终止灰阶" type="number" min="0" max="255" />
            <input v-model.number="colorbarWStep" aria-label="W 灰阶步进" type="number" min="1" max="255" />
          </div>
        </div>
        <div v-if="advanced && type === 'gradient'" class="advanced-panel"><strong>高级设置：RGB通道设置</strong><div v-for="(name, i) in ['R','G','B']" :key="name" class="rgb-row">{{ name }} <input v-model.number="rgbStart[i]" aria-label="起始" type="number" min="0" max="255" /><input v-model.number="rgbEnd[i]" aria-label="结束" type="number" min="0" max="255" /></div></div>
        <div v-if="advanced && type === 'crosstalk'" class="advanced-panel crosstalk-advanced-panel">
          <strong>高级设置：RGB 通道设置</strong>
          <div class="apl-rgb-settings">
            <span></span><span>R</span><span>G</span><span>B</span>
            <strong>前景</strong>
            <input v-for="(value, index) in crosstalkForeground" :key="`crosstalk-fg-${index}`" :value="value" aria-label="前景灰阶" type="number" min="0" max="255" @input="setRgb(crosstalkForeground, index, Number(($event.target as HTMLInputElement).value))" />
            <strong>背景</strong>
            <input v-for="(value, index) in crosstalkBackground" :key="`crosstalk-bg-${index}`" :value="value" aria-label="背景灰阶" type="number" min="0" max="255" @input="setRgb(crosstalkBackground, index, Number(($event.target as HTMLInputElement).value))" />
          </div>
        </div>
        <div v-if="advanced && type === 'border'" class="advanced-panel border-advanced-panel">
          <strong>高级设置：RGB 通道设置</strong>
          <div class="apl-rgb-settings">
            <span></span><span>R</span><span>G</span><span>B</span>
            <strong>边框</strong>
            <input v-for="(value, index) in borderForeground" :key="`border-fg-${index}`" :value="value" aria-label="边框灰阶" type="number" min="0" max="255" @input="setRgb(borderForeground, index, Number(($event.target as HTMLInputElement).value))" />
            <strong>背景</strong>
            <input v-for="(value, index) in borderBackground" :key="`border-bg-${index}`" :value="value" aria-label="背景灰阶" type="number" min="0" max="255" @input="setRgb(borderBackground, index, Number(($event.target as HTMLInputElement).value))" />
          </div>
        </div>
        <div v-if="advanced && type === 'checkerboard'" class="advanced-panel checkerboard-advanced-panel">
          <strong>高级设置：RGB 通道设置</strong>
          <div class="apl-rgb-settings">
            <span></span><span>R</span><span>G</span><span>B</span>
            <strong>背景</strong>
            <input v-for="(value, index) in checkerBackgroundRgb" :key="`checker-bg-${index}`" :value="value" aria-label="背景灰阶" type="number" min="0" max="255" @input="setRgb(checkerBackgroundRgb, index, Number(($event.target as HTMLInputElement).value))" />
            <strong>前景</strong>
            <input v-for="(value, index) in checkerForegroundRgb" :key="`checker-fg-${index}`" :value="value" aria-label="前景灰阶" type="number" min="0" max="255" @input="setRgb(checkerForegroundRgb, index, Number(($event.target as HTMLInputElement).value))" />
          </div>
        </div>
        <div v-if="advanced && type === 'apl'" class="advanced-panel apl-advanced-panel">
          <strong>高级设置：RGB 通道设置</strong>
          <div class="apl-rgb-settings">
            <span></span><span>R</span><span>G</span><span>B</span>
            <strong>前景</strong>
            <input v-for="(value, index) in aplForeground" :key="`apl-fg-${index}`" :value="value" aria-label="前景灰阶" type="number" min="0" max="255" @input="setRgb(aplForeground, index, Number(($event.target as HTMLInputElement).value))" />
            <strong>背景</strong>
            <input v-for="(value, index) in aplBackground" :key="`apl-bg-${index}`" :value="value" aria-label="背景灰阶" type="number" min="0" max="255" @input="setRgb(aplBackground, index, Number(($event.target as HTMLInputElement).value))" />
          </div>
          <label class="checkbox-label"><input v-model="aplBatchEnabled" type="checkbox" /> 启用批量生成功能</label>
          <p>勾选后按前景 RGB 的比例生成灰阶序列，背景 RGB 保持不变；未勾选时只生成当前配置的一张图片。</p>
          <div v-if="aplBatchEnabled" class="control-grid">
            <label>起始灰阶<input v-model.number="rangeStart" type="number" min="0" max="255" /></label>
            <label>终止灰阶<input v-model.number="rangeEnd" type="number" min="0" max="255" /></label>
            <label>灰阶步进<input v-model.number="rangeStep" type="number" min="1" max="255" /></label>
          </div>
        </div>
        <div v-if="advanced && type === 'solid'" class="advanced-panel">
          <label class="checkbox-label"><input v-model="solidBatchEnabled" type="checkbox" /> 启用批量生成功能</label>
          <p>勾选后，按当前选定通道生成灰阶序列；未勾选时只生成默认灰阶图片。</p>
          <div v-if="solidBatchEnabled" class="control-grid">
            <label>起始灰阶<input v-model.number="rangeStart" type="number" min="0" max="255" /></label>
            <label>终止灰阶<input v-model.number="rangeEnd" type="number" min="0" max="255" /></label>
            <label>灰阶步进<input v-model.number="rangeStep" type="number" min="1" max="255" /></label>
          </div>
        </div>
        <div class="directory-control"><div><span>生成目录</span><strong>{{ directoryName }}</strong></div><button class="secondary-button" type="button" @click="chooseDirectory">选择目录</button></div>
        <p v-if="error" class="input-error" role="alert">{{ error }}</p><button class="primary-button generate-button" type="button" @click="generate">生成并保存 BMP</button>
      </div>
      <div class="image-preview-card"><div class="preview-header"><span>实时预览</span><small>{{ filename }}</small></div><div class="image-preview"><img v-if="previewUrl" :src="previewUrl" alt="测试图片预览" /></div><canvas ref="canvas" class="hidden-canvas"></canvas></div>
    </div>
  </section>
</template>

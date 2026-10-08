<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  convertNumber,
  toPaddedBinary,
  type NumberBase,
  type ConversionResult,
} from './base-converter'

const inputValues = ref<Record<NumberBase, string>>({
  2: '',
  8: '',
  10: '',
  16: '',
})
const errors = ref<Record<NumberBase, string>>({
  2: '',
  8: '',
  10: '',
  16: '',
})
const results = ref<ConversionResult[]>([])

const baseLabels: Record<NumberBase, string> = {
  2: '二进制',
  8: '八进制',
  10: '十进制',
  16: '十六进制',
}

const placeholders: Record<NumberBase, string> = {
  2: '例如：11010110',
  8: '例如：326',
  10: '例如：214',
  16: '例如：D6',
}

const binaryValue = computed(() => {
  const result = results.value.find((item) => item.base === 2)
  return result ? toPaddedBinary(result.value) : ''
})

const binaryRows = computed(() => {
  const bits = binaryValue.value
  return Array.from({ length: 4 }, (_, row) =>
    bits.slice(row * 8, row * 8 + 8).split(''),
  )
})

function updateResults(sourceBase: NumberBase) {
  const value = inputValues.value[sourceBase]
  if (!value.trim()) {
    inputValues.value = { 2: '', 8: '', 10: '', 16: '' }
    errors.value = { 2: '', 8: '', 10: '', 16: '' }
    results.value = []
    return
  }

  try {
    const nextResults = convertNumber(value, sourceBase)
    results.value = nextResults
    errors.value = { 2: '', 8: '', 10: '', 16: '' }
    for (const result of nextResults) {
      inputValues.value[result.base] = result.value
    }
  } catch (conversionError) {
    errors.value[sourceBase] =
      conversionError instanceof Error ? conversionError.message : '转换失败，请检查输入。'
    results.value = []
  }
}

function handleInput(sourceBase: NumberBase) {
  for (const base of [2, 8, 10, 16] as NumberBase[]) {
    if (base !== sourceBase) {
      errors.value[base] = ''
    }
  }
  updateResults(sourceBase)
}

function clear() {
  inputValues.value = { 2: '', 8: '', 10: '', 16: '' }
  errors.value = { 2: '', 8: '', 10: '', 16: '' }
  results.value = []
}

async function copy(value: string) {
  await navigator.clipboard.writeText(value)
}

function toggleBit(row: number, column: number) {
  if (!binaryValue.value) return
  const bitIndex = row * 8 + column
  const bits = binaryValue.value.split('')
  bits[bitIndex] = bits[bitIndex] === '0' ? '1' : '0'
  const nextBinary = bits.join('')
  inputValues.value[2] = nextBinary.replace(/^0+(?=\d)/, '')
  handleInput(2)
}

</script>

<template>
  <section class="tool-page">
    <RouterLink class="back-link" to="/">← 返回工具中心</RouterLink>
    <div class="tool-page-header">
      <p class="eyebrow">BASIC CALCULATOR</p>
      <h1>进制转换<span>计算器</span></h1>
      <p>以十六进制和二进制互转为主，并同步查看八进制、十进制结果。固定 32 位位标尺，方便调试寄存器和像素数据。</p>
    </div>

    <div class="converter-panel">
      <div class="converter-input-area">
        <div v-for="base in [16, 2, 8, 10] as NumberBase[]" :key="base" class="base-input-field">
          <label :for="`base-${base}`">{{ baseLabels[base] }}</label>
          <input
            :id="`base-${base}`"
            v-model="inputValues[base]"
            :placeholder="placeholders[base]"
            autocomplete="off"
            :class="{ invalid: errors[base] }"
            :aria-invalid="Boolean(errors[base])"
            @input="handleInput(base)"
          />
          <p v-if="errors[base]" class="input-error" role="alert">{{ errors[base] }}</p>
        </div>
        <div class="converter-actions">
          <button class="secondary-button" type="button" @click="clear">清空</button>
        </div>
      </div>
    </div>

    <section class="bit-ruler" aria-labelledby="bit-ruler-title">
      <div class="bit-ruler-heading">
        <div>
          <p class="eyebrow">32-BIT REGISTER</p>
          <h2 id="bit-ruler-title">二进制位标尺</h2>
        </div>
        <span>点击任意 bit 切换 0 / 1</span>
      </div>
      <div v-if="binaryValue" class="bit-grid">
        <div v-for="(row, rowIndex) in binaryRows" :key="rowIndex" class="bit-row">
          <div v-for="(bit, columnIndex) in row" :key="columnIndex" class="bit-cell">
            <span class="bit-position">{{ 31 - rowIndex * 8 - columnIndex }}</span>
            <button
              type="button"
              :class="{ 'bit-one': bit === '1' }"
              :aria-label="`第 ${31 - rowIndex * 8 - columnIndex} 位，当前为 ${bit}`"
              @click="toggleBit(rowIndex, columnIndex)"
            >
              {{ bit }}
            </button>
          </div>
        </div>
      </div>
      <p v-else class="bit-placeholder">输入有效的二进制或十六进制数后显示 32 位标尺</p>
    </section>
  </section>
</template>

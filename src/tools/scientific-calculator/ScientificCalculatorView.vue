<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  applyAdvancedFunction,
  evaluateExpression,
  formatResult,
  type AdvancedFunction,
} from './calculator'

interface HistoryItem {
  expression: string
  result: string
}

const expression = ref('')
const result = ref('')
const error = ref('')
const history = ref<HistoryItem[]>([])
const showAdvanced = ref(false)
const advancedFunctions: { name: AdvancedFunction; label: string }[] = [
  { name: 'sqrt', label: '√x' },
  { name: 'sin', label: 'sin' },
  { name: 'cos', label: 'cos' },
  { name: 'tan', label: 'tan' },
  { name: 'ln', label: 'ln' },
  { name: 'log', label: 'log' },
  { name: 'abs', label: '|x|' },
]

const expressionInput = ref<HTMLInputElement | null>(null)

const displayResult = computed(() => result.value || '0')

function append(value: string) {
  expression.value += value
  error.value = ''
}

function pressKey(key: string) {
  append(key)
}

function handleKeyboard(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    calculate()
    return
  }

  if (event.key === 'Escape') {
    clear()
    return
  }
  if (event.key === 'Backspace') return
  const numpadKeyMap: Record<string, string> = {
    Numpad0: '0',
    Numpad1: '1',
    Numpad2: '2',
    Numpad3: '3',
    Numpad4: '4',
    Numpad5: '5',
    Numpad6: '6',
    Numpad7: '7',
    Numpad8: '8',
    Numpad9: '9',
    NumpadDecimal: '.',
    NumpadAdd: '+',
    NumpadSubtract: '-',
    NumpadMultiply: '*',
    NumpadDivide: '/',
    NumpadEqual: '=',
  }
  const key = numpadKeyMap[event.code] ?? event.key
  if (key === '=') {
    event.preventDefault()
    calculate()
    return
  }
  if (/^[0-9.+\-*/^()]$/.test(key)) {
    event.preventDefault()
    pressKey(key)
  }
}

function handleGlobalKeyboard(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return
  handleKeyboard(event)
  if (/^[0-9.+\-*/^()]$/.test(event.key) || event.code.startsWith('Numpad')) {
    expressionInput.value?.focus()
  }
}

function clear() {
  expression.value = ''
  result.value = ''
  error.value = ''
}

function clearEntry() {
  expression.value = expression.value.replace(/(?:\d+(?:\.\d*)?|\.\d+)$/, '')
  result.value = ''
  error.value = ''
}

function backspace() {
  expression.value = expression.value.slice(0, -1)
  error.value = ''
}

function calculate() {
  try {
    const value = evaluateExpression(expression.value)
    const formatted = formatResult(value)
    result.value = formatted
    error.value = ''
    history.value.unshift({ expression: expression.value, result: formatted })
    history.value = history.value.slice(0, 20)
  } catch (calculationError) {
    result.value = ''
    error.value = calculationError instanceof Error ? calculationError.message : '计算失败，请检查表达式。'
  }
}

function square() {
  applyUnaryOperation((value) => value ** 2, 'x²')
}

function power() {
  append('^')
}

function applyUnaryOperation(operation: (value: number) => number, label: string) {
  try {
    const expressionText = expression.value
    const value = evaluateExpression(expressionText)
    const operationResult = operation(value)
    if (!Number.isFinite(operationResult)) {
      throw new Error('计算结果无效，请检查输入。')
    }
    const formatted = formatResult(operationResult)
    expression.value = formatted
    result.value = formatted
    error.value = ''
    history.value.unshift({ expression: `${label}(${expressionText})`, result: formatted })
    history.value = history.value.slice(0, 20)
  } catch (calculationError) {
    result.value = ''
    error.value = calculationError instanceof Error ? calculationError.message : '计算失败，请检查表达式。'
  }
}

function percentage() {
  applyUnaryOperation((value) => value / 100, '%')
}

function reciprocal() {
  applyUnaryOperation((value) => 1 / value, '1/x')
}

function squareRoot() {
  applyUnaryOperation(Math.sqrt, '√')
}

function toggleSign() {
  if (!expression.value.trim()) {
    append('-')
    return
  }
  expression.value = expression.value.startsWith('-(') && expression.value.endsWith(')')
    ? expression.value.slice(2, -1)
    : `-(${expression.value})`
  error.value = ''
}

function useAdvancedFunction(name: AdvancedFunction) {
  try {
    const value = evaluateExpression(expression.value)
    const advancedResult = formatResult(applyAdvancedFunction(name, value))
    result.value = advancedResult
    error.value = ''
    history.value.unshift({ expression: `${name}(${expression.value})`, result: advancedResult })
    history.value = history.value.slice(0, 20)
  } catch (calculationError) {
    error.value = calculationError instanceof Error ? calculationError.message : '函数计算失败。'
  }
}

function restore(item: HistoryItem) {
  expression.value = item.expression
  result.value = item.result
  error.value = ''
}

onMounted(() => {
  expressionInput.value?.focus()
  document.addEventListener('keydown', handleGlobalKeyboard)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeyboard)
})
</script>

<template>
  <section class="tool-page calculator-page">
    <RouterLink class="back-link" to="/">← 返回工具中心</RouterLink>
    <div class="tool-page-header">
      <p class="eyebrow">SCIENTIFIC CALCULATOR</p>
      <h1>科学<span>计算器</span></h1>
      <p>支持四则运算、平方、幂次运算，并提供常用高级函数。</p>
    </div>

    <div class="calculator-layout">
      <div class="calculator-card">
        <div class="calculator-display">
          <input
            ref="expressionInput"
            v-model="expression"
            aria-label="计算表达式"
            inputmode="decimal"
            placeholder="输入表达式，例如 12 × 3 + 4"
            @keydown="handleKeyboard"
          />
          <div class="calculator-result">{{ displayResult }}</div>
          <p v-if="error" class="input-error" role="alert">{{ error }}</p>
        </div>
        <div class="calculator-keypad">
          <button type="button" @click="percentage">%</button>
          <button type="button" @click="clearEntry">CE</button>
          <button type="button" @click="clear">C</button>
          <button type="button" @click="backspace">⌫</button>
          <button type="button" @click="reciprocal">¹⁄ₓ</button>
          <button type="button" @click="square">x²</button>
          <button type="button" @click="squareRoot">²√x</button>
          <button type="button" @click="pressKey('/')">÷</button>
          <button type="button" @click="pressKey('7')">7</button>
          <button type="button" @click="pressKey('8')">8</button>
          <button type="button" @click="pressKey('9')">9</button>
          <button type="button" @click="pressKey('*')">×</button>
          <button type="button" @click="pressKey('4')">4</button>
          <button type="button" @click="pressKey('5')">5</button>
          <button type="button" @click="pressKey('6')">6</button>
          <button type="button" @click="pressKey('-')">−</button>
          <button type="button" @click="pressKey('1')">1</button>
          <button type="button" @click="pressKey('2')">2</button>
          <button type="button" @click="pressKey('3')">3</button>
          <button type="button" @click="pressKey('+')">+</button>
          <button type="button" @click="toggleSign">+/−</button>
          <button type="button" @click="pressKey('0')">0</button>
          <button type="button" @click="pressKey('.')">.</button>
          <button class="calculate-button" type="button" @click="calculate">=</button>
        </div>
        <button class="advanced-toggle" type="button" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '收起高级函数' : '展开高级函数' }} <span>{{ showAdvanced ? '↑' : '↓' }}</span>
        </button>
        <div v-if="showAdvanced" class="advanced-functions">
          <button type="button" @click="power">xʸ</button>
          <button v-for="item in advancedFunctions" :key="item.name" type="button" @click="useAdvancedFunction(item.name)">
            {{ item.label }}
          </button>
        </div>
      </div>

      <aside class="history-card">
        <div class="history-heading">
          <h2>历史记录</h2>
          <button v-if="history.length" type="button" @click="history = []">清除</button>
        </div>
        <button v-for="item in history" :key="`${item.expression}-${item.result}`" class="history-item" type="button" @click="restore(item)">
          <span>{{ item.expression }}</span>
          <strong>= {{ item.result }}</strong>
        </button>
        <p v-if="!history.length" class="history-empty">完成计算后，历史记录会显示在这里。</p>
      </aside>
    </div>
  </section>
</template>

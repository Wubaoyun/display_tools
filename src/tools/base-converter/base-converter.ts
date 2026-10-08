export type NumberBase = 2 | 8 | 10 | 16

export interface ConversionResult {
  base: NumberBase
  value: string
}

function parseBigInt(value: string, base: NumberBase): bigint {
  const radix = BigInt(base)
  let result = 0n

  for (const digit of value.toLowerCase()) {
    const digitValue = BigInt(parseInt(digit, 16))
    result = result * radix + digitValue
  }

  return result
}

export function convertNumber(value: string, sourceBase: NumberBase): ConversionResult[] {
  const trimmed = value.trim()
  const prefix = trimmed.slice(0, 2).toLowerCase()
  const expectedPrefix = { 2: '0b', 8: '0o', 10: '', 16: '0x' }[sourceBase]
  const hasPrefix = ['0b', '0o', '0x'].includes(prefix)
  if (hasPrefix && prefix !== expectedPrefix) {
    throw new Error(`当前输入框是${sourceBase}进制，不支持 ${prefix} 前缀。`)
  }

  const normalized = expectedPrefix && prefix === expectedPrefix
    ? trimmed.slice(2)
    : trimmed
  if (!normalized) {
    throw new Error('请输入需要转换的数值。')
  }

  const pattern = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^\d+$/,
    16: /^[0-9a-f]+$/i,
  }[sourceBase]

  if (!pattern.test(normalized)) {
    throw new Error(`输入内容不是有效的 ${sourceBase} 进制数。`)
  }

  const decimal = parseBigInt(normalized, sourceBase)
  if (decimal > 0xffffffffn) {
    throw new Error('当前位标尺固定为 32 位，请输入不超过 32 位的数值。')
  }

  return ([2, 8, 10, 16] as NumberBase[]).map((base) => ({
    base,
    value: decimal.toString(base).toUpperCase(),
  }))
}

export function toPaddedBinary(value: string): string {
  return value.padStart(32, '0')
}

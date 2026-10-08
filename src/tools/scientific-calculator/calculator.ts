export type AdvancedFunction = 'sqrt' | 'sin' | 'cos' | 'tan' | 'ln' | 'log' | 'abs'

const operators: Record<string, { precedence: number; associativity: 'left' | 'right' }> = {
  '+': { precedence: 1, associativity: 'left' },
  '-': { precedence: 1, associativity: 'left' },
  '*': { precedence: 2, associativity: 'left' },
  '/': { precedence: 2, associativity: 'left' },
  '^': { precedence: 3, associativity: 'right' },
}

function tokenize(expression: string): string[] {
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+|[()+\-*/^])/g) ?? []
  if (tokens.join('') !== expression.replace(/\s+/g, '')) {
    throw new Error('表达式包含无法识别的字符。')
  }
  return tokens
}

function toRpn(tokens: string[]): string[] {
  const output: string[] = []
  const stack: string[] = []
  let previous: string | undefined

  for (const token of tokens) {
    if (!Number.isNaN(Number(token))) {
      output.push(token)
    } else if (token === '-' && (!previous || previous === '(' || previous in operators)) {
      output.push('0')
      stack.push('-')
    } else if (token in operators) {
      while (stack.length) {
        const top = stack[stack.length - 1]
        if (!(top in operators)) break
        const current = operators[token]
        const topOperator = operators[top]
        const shouldPop = current.associativity === 'left'
          ? current.precedence <= topOperator.precedence
          : current.precedence < topOperator.precedence
        if (!shouldPop) break
        output.push(stack.pop()!)
      }
      stack.push(token)
    } else if (token === '(') {
      stack.push(token)
    } else if (token === ')') {
      let matched = false
      while (stack.length) {
        const top = stack.pop()!
        if (top === '(') {
          matched = true
          break
        }
        output.push(top)
      }
      if (!matched) throw new Error('括号不匹配。')
    }
    previous = token
  }

  while (stack.length) {
    const token = stack.pop()!
    if (token === '(') throw new Error('括号不匹配。')
    output.push(token)
  }
  return output
}

export function evaluateExpression(expression: string): number {
  const rpn = toRpn(tokenize(expression.trim()))
  if (!rpn.length) throw new Error('请输入计算表达式。')
  const values: number[] = []

  for (const token of rpn) {
    if (!Number.isNaN(Number(token))) {
      values.push(Number(token))
      continue
    }
    const right = values.pop()
    const left = values.pop()
    if (left === undefined || right === undefined) throw new Error('表达式格式不正确。')
    const result = {
      '+': left + right,
      '-': left - right,
      '*': left * right,
      '/': right === 0 ? NaN : left / right,
      '^': left ** right,
    }[token]
    if (result === undefined || !Number.isFinite(result)) throw new Error('计算结果无效，请检查输入。')
    values.push(result)
  }
  if (values.length !== 1) throw new Error('表达式格式不正确。')
  return values[0]
}

export function applyAdvancedFunction(name: AdvancedFunction, value: number): number {
  const result = {
    sqrt: Math.sqrt(value),
    sin: Math.sin(value * Math.PI / 180),
    cos: Math.cos(value * Math.PI / 180),
    tan: Math.tan(value * Math.PI / 180),
    ln: Math.log(value),
    log: Math.log10(value),
    abs: Math.abs(value),
  }[name]
  if (!Number.isFinite(result)) throw new Error('该函数的输入范围无效。')
  return result
}

export function formatResult(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toPrecision(12).replace(/\.?0+$/, '')
}

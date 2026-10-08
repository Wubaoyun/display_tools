export type ToolCategory = '基础计算' | '图像处理' | '设置速查' | '显示工程'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  status: 'planned' | 'ready'
  version?: string
  path?: string
}

export const toolDefinitions: ToolDefinition[] = [
  {
    id: 'base-converter',
    name: '进制转换计算器',
    description: '在二进制、十进制、十六进制之间快速转换。',
    category: '基础计算',
    status: 'ready',
    version: 'v1.0.0',
    path: '/tools/base-converter',
  },
  {
    id: 'image-generator',
    name: '图片生成器',
    description: '生成 OLED 显示模组调试所需的 RGBW、渐变、Colorbar、Crosstalk 和棋盘格 BMP 图片。',
    category: '图像处理',
    status: 'ready',
    version: 'v1.0.0',
    path: '/tools/image-generator',
  },
  {
    id: 'scientific-calculator',
    name: '科学计算器',
    description: '完成四则运算、平方、幂次和常用高级函数计算。',
    category: '基础计算',
    status: 'ready',
    version: 'v1.0.0',
    path: '/tools/scientific-calculator',
  },
  {
    id: 'image-converter',
    name: '图片格式转换器',
    description: '转换常见图片格式，并为后续压缩和尺寸处理预留入口。',
    category: '图像处理',
    status: 'planned',
  },
  {
    id: 'gamma-curve-lookup',
    name: 'Gamma曲线速查',
    description: '根据亮度节点和 Gamma 值绘制灰阶-绝对亮度曲线，并查询测量亮度或灰阶的节点交点。',
    category: '设置速查',
    status: 'ready',
    version: 'v1.0.0',
    path: '/tools/gamma-curve-lookup',
  },
]

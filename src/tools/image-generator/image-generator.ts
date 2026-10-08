export type ImageType = 'colorbar' | 'solid' | 'gradient' | 'apl' | 'checkerboard' | 'crosstalk' | 'border' | 'custom'
export type Channel = 'R' | 'G' | 'B' | 'W'
export type Direction = 'horizontal' | 'vertical' | 'x'
export type RGB = [number, number, number]

export interface ImageOptions {
  width: number
  height: number
  type: ImageType
  channel?: Channel
  gray?: number
  direction?: Direction
  colorbarStart?: number
  colorbarEnd?: number
  colorbarStep?: number
  colorbarRgbStart?: RGB
  colorbarRgbEnd?: RGB
  colorbarRgbStep?: RGB
  colorbarWStart?: number
  colorbarWEnd?: number
  colorbarWStep?: number
  rgbStart?: RGB
  rgbEnd?: RGB
  aplShape?: 'circle' | 'rect'
  aplSize?: number
  aplForeground?: RGB
  aplBackground?: RGB
  checkerSize?: number
  checkerBackgroundRgb?: RGB
  checkerForegroundRgb?: RGB
  crosstalkLayout?: number
  crosstalkBackground?: RGB
  crosstalkForeground?: RGB
  borderWidth?: number
  borderBackground?: RGB
  borderForeground?: RGB
  customScript?: string
}

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)))
const rgb = (v: RGB = [0, 0, 0]) => `rgb(${clamp(v[0])},${clamp(v[1])},${clamp(v[2])})`
const channelColor = (channel: Channel, value: number): RGB => channel === 'R' ? [value, 0, 0] : channel === 'G' ? [0, value, 0] : channel === 'B' ? [0, 0, value] : [value, value, value]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const steppedValues = (start: number, end: number, step: number) => {
  const increment = Math.max(1, Math.abs(step))
  const direction = end >= start ? 1 : -1
  const values: number[] = []
  for (let value = start; direction > 0 ? value <= end : value >= end; value += direction * increment) {
    values.push(value)
  }
  if (values[values.length - 1] !== end) values.push(end)
  return values
}

function drawColorbar(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  direction: Direction,
  channel: Channel,
  start: number,
  end: number,
  step: number,
  index: number,
) {
  const values = steppedValues(clamp(start), clamp(end), step)
  const horizontal = direction === 'horizontal'
  const barX = horizontal ? 0 : Math.floor(index * width / 4)
  const barY = horizontal ? Math.floor(index * height / 4) : 0
  const barWidth = horizontal ? width : Math.ceil(width / 4)
  const barHeight = horizontal ? Math.ceil(height / 4) : height
  values.forEach((value, valueIndex) => {
    const nextIndex = valueIndex + 1
    const startRatio = valueIndex / values.length
    const endRatio = nextIndex / values.length
    const x = horizontal ? barX + Math.floor(startRatio * barWidth) : barX
    const y = horizontal ? barY : barY + barHeight - Math.ceil(endRatio * barHeight)
    const segmentWidth = horizontal ? Math.max(1, Math.ceil((endRatio - startRatio) * barWidth)) : barWidth
    const segmentHeight = horizontal ? barHeight : Math.max(1, Math.ceil((endRatio - startRatio) * barHeight))
    context.fillStyle = rgb(channelColor(channel, value))
    context.fillRect(x, y, segmentWidth, segmentHeight)
  })
}

function drawGradient(context: CanvasRenderingContext2D, width: number, height: number, direction: Direction, start: RGB, end: RGB) {
  const gradient = direction === 'vertical' ? context.createLinearGradient(0, height, 0, 0) : context.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, rgb(start)); gradient.addColorStop(1, rgb(end))
  context.fillStyle = gradient; context.fillRect(0, 0, width, height)
}

function drawCrosstalk(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  direction: Direction,
  layout: number,
  foreground: RGB,
  background: RGB,
) {
  context.fillStyle = rgb(background)
  context.fillRect(0, 0, width, height)
  context.fillStyle = rgb(foreground)

  const blockWidth = Math.max(1, Math.round(width / 3))
  const blockHeight = Math.max(1, Math.round(height / 3))
  const offset = 1 / 6
  const normalizedLayout = Math.max(0, Math.min(2, Math.floor(layout)))
  const clampCenter = (center: number, blockSize: number, totalSize: number) =>
    Math.max(blockSize / (2 * totalSize), Math.min(1 - blockSize / (2 * totalSize), center))
  const position = normalizedLayout - 1

  if (direction === 'horizontal') {
    const y = Math.round(height * clampCenter(1 / 2 + position * offset, blockHeight, height) - blockHeight / 2)
    context.fillRect(0, y, blockWidth, blockHeight)
    context.fillRect(width - blockWidth, y, blockWidth, blockHeight)
  } else {
    const x = Math.round(width * clampCenter(1 / 2 + position * offset, blockWidth, width) - blockWidth / 2)
    context.fillRect(x, 0, blockWidth, blockHeight)
    context.fillRect(x, height - blockHeight, blockWidth, blockHeight)
  }
}

function drawCustom(context: CanvasRenderingContext2D, options: ImageOptions) {
  const { width, height } = options
  context.fillStyle = '#000'; context.fillRect(0, 0, width, height)
  for (const raw of (options.customScript || '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const p = line.split(/\s+/)
    const nums = p.slice(1).map(Number)
    if (p[0] === 'fill' && nums.length >= 3) { context.fillStyle = rgb([nums[0], nums[1], nums[2]]); context.fillRect(0, 0, width, height) }
    else if (p[0] === 'rect' && nums.length >= 7) { context.fillStyle = rgb([nums[4], nums[5], nums[6]]); context.fillRect(nums[0], nums[1], nums[2], nums[3]) }
    else if (p[0] === 'circle' && nums.length >= 6) { context.fillStyle = rgb([nums[3], nums[4], nums[5]]); context.beginPath(); context.arc(nums[0], nums[1], nums[2], 0, Math.PI * 2); context.fill() }
    else if (p[0] === 'border' && nums.length >= 4) { const w = Math.max(0, nums[0]); context.strokeStyle = rgb([nums[1], nums[2], nums[3]]); context.lineWidth = w; context.strokeRect(w / 2, w / 2, width - w, height - w) }
    else if (p[0] === 'gradient' && nums.length >= 7) drawGradient(context, width, height, nums[0] === 1 ? 'vertical' : 'horizontal', [nums[1], nums[2], nums[3]], [nums[4], nums[5], nums[6]])
  }
}

export function drawTestImage(canvas: HTMLCanvasElement, options: ImageOptions): void {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器不支持 Canvas。')
  const width = Math.max(1, Math.floor(options.width)); const height = Math.max(1, Math.floor(options.height))
  canvas.width = width; canvas.height = height
  const gray = clamp(options.gray ?? 128)
  const direction = options.direction ?? 'horizontal'
  context.globalCompositeOperation = 'source-over'
  context.fillStyle = '#000'; context.fillRect(0, 0, width, height)
  if (options.type === 'solid') {
    context.fillStyle = rgb(channelColor(options.channel ?? 'W', gray)); context.fillRect(0, 0, width, height)
  } else if (options.type === 'colorbar') {
    const channels: Channel[] = ['R', 'G', 'B', 'W']
    channels.forEach((ch, index) => {
      const isWhite = ch === 'W'
      const start = isWhite ? options.colorbarWStart ?? 0 : options.colorbarRgbStart?.[index] ?? 0
      const end = isWhite ? options.colorbarWEnd ?? 255 : options.colorbarRgbEnd?.[index] ?? 255
      const step = isWhite ? options.colorbarWStep ?? 1 : options.colorbarRgbStep?.[index] ?? 1
      drawColorbar(context, width, height, direction, ch, start, end, step, index)
    })
  } else if (options.type === 'gradient') {
    const starts = options.rgbStart ?? [0, 0, 0]; const ends = options.rgbEnd ?? [255, 255, 255]
    if (direction === 'x') {
      const g = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2)
      g.addColorStop(0, rgb(ends)); g.addColorStop(1, rgb(starts)); context.fillStyle = g; context.fillRect(0, 0, width, height)
    } else drawGradient(context, width, height, direction, starts, ends)
  } else if (options.type === 'apl') {
    context.fillStyle = rgb(options.aplBackground ?? [0, 0, 0]); context.fillRect(0, 0, width, height)
    context.fillStyle = rgb(options.aplForeground ?? [255, 255, 255]); const size = Math.max(1, Math.min(99, options.aplSize ?? 50)) / 100
    const w = width * size; const h = height * size
    if (options.aplShape === 'circle') { context.beginPath(); context.arc(width / 2, height / 2, Math.min(w, h) / 2, 0, Math.PI * 2); context.fill() }
    else context.fillRect((width - w) / 2, (height - h) / 2, w, h)
  } else if (options.type === 'checkerboard') {
    const size = Math.max(1, Math.floor(options.checkerSize ?? 32))
    const background = options.checkerBackgroundRgb ?? [0, 0, 0]
    const foreground = options.checkerForegroundRgb ?? [255, 255, 255]
    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        const isForeground = (x / size + y / size) % 2 !== 0
        context.fillStyle = rgb(isForeground ? foreground : background)
        context.fillRect(x, y, size, size)
      }
    }
  } else if (options.type === 'crosstalk') {
    drawCrosstalk(
      context,
      width,
      height,
      direction,
      options.crosstalkLayout ?? 0,
      options.crosstalkForeground ?? [0, 0, 0],
      options.crosstalkBackground ?? [127, 127, 127],
    )
  } else if (options.type === 'border') {
    context.fillStyle = rgb(options.borderBackground ?? [0, 0, 0])
    context.fillRect(0, 0, width, height)
    const w = Math.min(Math.max(0, Math.floor(options.borderWidth ?? 8)), Math.ceil(Math.min(width, height) / 2))
    if (w > 0) {
      context.fillStyle = rgb(options.borderForeground ?? [255, 255, 255])
      context.fillRect(0, 0, width, w)
      context.fillRect(0, height - w, width, w)
      context.fillRect(0, 0, w, height)
      context.fillRect(width - w, 0, w, height)
      context.fillRect(width - w, height - w, w, w)
    }
  } else if (options.type === 'custom') drawCustom(context, options)
}

export function canvasToBmp(canvas: HTMLCanvasElement): Blob {
  const context = canvas.getContext('2d'); if (!context) throw new Error('无法读取 Canvas 数据。')
  const { width, height } = canvas; const pixels = context.getImageData(0, 0, width, height).data
  const rowSize = Math.floor((24 * width + 31) / 32) * 4; const pixelOffset = 54; const buffer = new ArrayBuffer(pixelOffset + rowSize * height); const view = new DataView(buffer)
  view.setUint16(0, 0x4d42, true); view.setUint32(2, buffer.byteLength, true); view.setUint32(10, pixelOffset, true); view.setUint32(14, 40, true); view.setInt32(18, width, true); view.setInt32(22, height, true); view.setUint16(26, 1, true); view.setUint16(28, 24, true); view.setUint32(34, rowSize * height, true)
  for (let y = 0; y < height; y++) { const sourceY = height - 1 - y; for (let x = 0; x < width; x++) { const source = (sourceY * width + x) * 4; const target = pixelOffset + y * rowSize + x * 3; view.setUint8(target, pixels[source + 2]); view.setUint8(target + 1, pixels[source + 1]); view.setUint8(target + 2, pixels[source]) } }
  return new Blob([buffer], { type: 'image/bmp' })
}

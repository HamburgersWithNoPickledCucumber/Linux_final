import { useEffect, useRef, useState } from 'react'

export default function LiveChart({
  history,
  max,
  colors,
  threshold = null,
  area = false,
  unit = '',
}) {
  const canvasRef = useRef(null)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => drawChart(canvas, history, max, colors, threshold, area, hover)
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [area, colors, history, hover, max, threshold])

  const handlePointerMove = (event) => {
    if (!history.length) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((event.clientX - rect.left - 42) / Math.max(rect.width - 58, 1), 0), 1)
    const index = Math.round(ratio * (history.length - 1))
    setHover({
      index,
      xPercent: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100,
      point: history[index],
    })
  }

  return (
    <div
      className="live-chart-wrap"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHover(null)}
    >
      <canvas ref={canvasRef} className="live-chart" aria-label="Live metric chart" />
      {hover?.point && (
        <div
          className="chart-tooltip"
          style={{ left: `${Math.min(Math.max(hover.xPercent, 16), 82)}%` }}
        >
          <time>{new Date(hover.point.at).toLocaleTimeString([], { hour12: false })}</time>
          {Object.entries(hover.point.values).map(([name, value], index) => (
            <span key={name}>
              <i style={{ background: colors[index % colors.length] }} />
              {formatName(name)} <strong>{Number(value).toFixed(value % 1 ? 1 : 0)}{unit}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function drawChart(canvas, history, fixedMax, colors, threshold, area, hover) {
  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const width = Math.max(rect.width, 1)
  const height = Math.max(rect.height, 1)
  canvas.width = width * ratio
  canvas.height = height * ratio

  const context = canvas.getContext('2d')
  context.scale(ratio, ratio)
  const style = getComputedStyle(document.documentElement)
  const gridColor = style.getPropertyValue('--chart-grid').trim() || 'rgba(148, 163, 184, 0.1)'
  const textColor = style.getPropertyValue('--text-muted').trim()
  context.clearRect(0, 0, width, height)

  const padding = { top: 18, right: 16, bottom: 25, left: 42 }
  const chartWidth = Math.max(width - padding.left - padding.right, 1)
  const chartHeight = Math.max(height - padding.top - padding.bottom, 1)
  const values = history.flatMap((point) => Object.values(point.values))
  const computedMax = Math.max(...values, 1)
  const chartMax = fixedMax || roundMax(computedMax)

  context.strokeStyle = gridColor
  context.fillStyle = textColor
  context.font = '9px "JetBrains Mono", monospace'
  context.lineWidth = 1

  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (chartHeight / 4) * index
    context.setLineDash(index === 4 ? [] : [3, 5])
    context.beginPath()
    context.moveTo(padding.left, y)
    context.lineTo(width - padding.right, y)
    context.stroke()
    context.fillText(String(Math.round(chartMax - (chartMax / 4) * index)), 6, y + 3)
  }
  context.setLineDash([])

  if (threshold && threshold < chartMax) {
    const y = padding.top + chartHeight - (threshold / chartMax) * chartHeight
    context.strokeStyle = 'rgba(250, 204, 21, 0.42)'
    context.setLineDash([5, 5])
    context.beginPath()
    context.moveTo(padding.left, y)
    context.lineTo(width - padding.right, y)
    context.stroke()
    context.fillStyle = '#facc15'
    context.fillText(`ALERT ${threshold}`, width - 76, y - 5)
    context.setLineDash([])
  }

  if (history.length < 2) return
  const names = Object.keys(history.at(-1).values)
  names.forEach((name, seriesIndex) => {
    const points = history.map((point, index) => ({
      x: padding.left + (index / Math.max(history.length - 1, 1)) * chartWidth,
      y: padding.top + chartHeight - Math.min((Number(point.values[name]) || 0) / chartMax, 1) * chartHeight,
    }))
    const stroke = colors[seriesIndex % colors.length]

    if (area && seriesIndex === 0) {
      const gradient = context.createLinearGradient(0, padding.top, 0, height)
      gradient.addColorStop(0, `${stroke}44`)
      gradient.addColorStop(0.55, `${stroke}14`)
      gradient.addColorStop(1, `${stroke}00`)
      context.beginPath()
      points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y))
      context.lineTo(points.at(-1).x, padding.top + chartHeight)
      context.lineTo(points[0].x, padding.top + chartHeight)
      context.closePath()
      context.fillStyle = gradient
      context.fill()
    }

    context.beginPath()
    points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y))
    context.strokeStyle = stroke
    context.lineWidth = 2
    context.shadowColor = stroke
    context.shadowBlur = 8
    context.stroke()
    context.shadowBlur = 0

    if (hover && points[hover.index]) {
      const point = points[hover.index]
      context.fillStyle = stroke
      context.beginPath()
      context.arc(point.x, point.y, 3.5, 0, Math.PI * 2)
      context.fill()
    }
  })

  if (hover) {
    const x = padding.left + (hover.index / Math.max(history.length - 1, 1)) * chartWidth
    context.strokeStyle = 'rgba(226, 232, 240, 0.28)'
    context.setLineDash([2, 4])
    context.beginPath()
    context.moveTo(x, padding.top)
    context.lineTo(x, padding.top + chartHeight)
    context.stroke()
  }
}

function roundMax(value) {
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function formatName(name) {
  return name === 'value' ? 'Current' : name.replaceAll('_', ' ')
}

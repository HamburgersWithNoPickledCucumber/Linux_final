import { useEffect, useRef } from 'react'

export default function Sparkline({ values, tone = 'normal' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = () => drawSparkline(canvas, values, tone)
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [tone, values])

  return <canvas ref={canvasRef} className="metric-sparkline" aria-hidden="true" />
}

function drawSparkline(canvas, values, tone) {
  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1
  const width = Math.max(rect.width, 1)
  const height = Math.max(rect.height, 1)
  canvas.width = width * ratio
  canvas.height = height * ratio
  const context = canvas.getContext('2d')
  context.scale(ratio, ratio)
  context.clearRect(0, 0, width, height)

  const colors = {
    normal: ['#2dd4bf', 'rgba(45, 212, 191, 0.03)'],
    warning: ['#facc15', 'rgba(250, 204, 21, 0.03)'],
    danger: ['#fb7185', 'rgba(251, 113, 133, 0.03)'],
    muted: ['#64748b', 'rgba(100, 116, 139, 0.02)'],
  }
  const [stroke, fade] = colors[tone] || colors.normal
  const points = values.length > 1 ? values : [values[0] || 0, values[0] || 0]
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = Math.max(max - min, 1)
  const y = (value) => 5 + (height - 10) * (1 - (value - min) / range)
  const x = (index) => (index / Math.max(points.length - 1, 1)) * width

  const gradient = context.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, `${stroke}45`)
  gradient.addColorStop(1, fade)

  context.beginPath()
  points.forEach((value, index) => {
    if (index === 0) context.moveTo(x(index), y(value))
    else context.lineTo(x(index), y(value))
  })
  context.lineTo(width, height)
  context.lineTo(0, height)
  context.closePath()
  context.fillStyle = gradient
  context.fill()

  context.beginPath()
  points.forEach((value, index) => {
    if (index === 0) context.moveTo(x(index), y(value))
    else context.lineTo(x(index), y(value))
  })
  context.strokeStyle = stroke
  context.lineWidth = 1.7
  context.shadowColor = stroke
  context.shadowBlur = 7
  context.stroke()
}

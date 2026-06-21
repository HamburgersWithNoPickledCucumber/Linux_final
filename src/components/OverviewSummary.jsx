import { useEffect, useMemo, useState } from 'react'
import MetricCard from './MetricCard'
import SectionHeader from './SectionHeader'
import { useModuleSnapshot } from '../state/moduleStore'

export default function OverviewSummary() {
  const cpu = useModuleSnapshot('cpu_utilization').data
  const ram = useModuleSnapshot('current_ram').data
  const disk = useModuleSnapshot('disk_partitions').data
  const swap = useModuleSnapshot('swap').data

  const metrics = useMemo(() => [
    buildCpuMetric(cpu),
    buildRamMetric(ram),
    buildDiskMetric(disk),
    buildSwapMetric(swap),
  ], [cpu, disk, ram, swap])

  return (
    <section className="dashboard-section overview-section" id="overview">
      <SectionHeader
        eyebrow="01 / OVERVIEW"
        title="System pulse"
        description="Live operational health across compute, memory, and storage."
      />
      <div className="metric-grid">
        {metrics.map((metric) => <TrackedMetricCard key={metric.label} metric={metric} />)}
      </div>
    </section>
  )
}

function TrackedMetricCard({ metric }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!Number.isFinite(metric.raw)) return
    setHistory((current) => [...current, metric.raw].slice(-24))
  }, [metric.raw])

  const previous = history.length > 1 ? history.at(-2) : metric.raw
  const trend = Number.isFinite(previous) && previous !== 0
    ? ((metric.raw - previous) / Math.abs(previous)) * 100
    : 0

  return <MetricCard {...metric} history={history} trend={trend} />
}

function buildCpuMetric(data) {
  const raw = Number(data)
  const tone = toneFor(raw, 70, 90)
  return {
    label: 'CPU LOAD',
    value: Number.isFinite(raw) ? Math.round(raw) : '—',
    unit: '%',
    raw,
    tone,
    status: labelFor(tone),
    description: tone === 'normal' ? 'Compute headroom available' : 'Sustained compute pressure detected',
    meta: 'utilization',
  }
}

function buildRamMetric(data) {
  const raw = data?.total ? (Number(data.used) / Number(data.total)) * 100 : NaN
  const tone = toneFor(raw, 75, 90)
  return {
    label: 'RAM USAGE',
    value: Number.isFinite(Number(data?.used)) ? formatMemory(data.used) : '—',
    raw,
    tone,
    status: labelFor(tone),
    description: tone === 'muted'
      ? 'Awaiting memory telemetry'
      : tone === 'normal' ? 'Memory pressure within limits' : 'Memory pressure elevated',
    meta: Number.isFinite(raw) ? `${Math.round(raw)}% allocated` : 'awaiting data',
  }
}

function buildDiskMetric(data) {
  const partition = Array.isArray(data)
    ? data.find((item) => item.mounted === '/') || data[0]
    : null
  const raw = Number.parseFloat(partition?.['used%'])
  const tone = toneFor(raw, 80, 92)
  return {
    label: 'DISK USAGE',
    value: Number.isFinite(raw) ? Math.round(raw) : '—',
    unit: '%',
    raw,
    tone,
    status: labelFor(tone),
    description: tone === 'muted'
      ? 'Awaiting volume telemetry'
      : tone === 'normal' ? 'Primary volume stable' : 'Primary volume nearing capacity',
    meta: partition?.mounted ? `mount ${partition.mounted}` : 'awaiting data',
  }
}

function buildSwapMetric(data) {
  const rows = Array.isArray(data) ? data : []
  const total = rows.reduce((sum, row) => sum + (Number(row.size) || 0), 0)
  const used = rows.reduce((sum, row) => sum + (Number(row.used) || 0), 0)
  const raw = total ? (used / total) * 100 : 0
  const tone = toneFor(raw, 35, 70)
  return {
    label: 'SWAP USAGE',
    value: formatMemory(used / 1024),
    raw,
    tone,
    status: labelFor(tone),
    description: raw > 35 ? 'Swap activity requires attention' : 'Swap pressure nominal',
    meta: total ? `${Math.round(raw)}% of ${formatMemory(total / 1024)}` : 'no swap configured',
  }
}

function toneFor(value, warning, danger) {
  if (!Number.isFinite(value)) return 'muted'
  if (value >= danger) return 'danger'
  if (value >= warning) return 'warning'
  return 'normal'
}

function labelFor(tone) {
  return { normal: 'NORMAL', warning: 'WARNING', danger: 'CRITICAL', muted: 'WAITING' }[tone]
}

function formatMemory(value) {
  const megabytes = Number(value)
  if (!Number.isFinite(megabytes)) return '—'
  if (megabytes >= 1024) return `${(megabytes / 1024).toFixed(2)} GB`
  return `${Math.max(0, Math.round(megabytes))} MB`
}

import { useEffect, useMemo, useState } from 'react'
import DashboardCard from './DashboardCard'
import LiveChart from './LiveChart'
import Loader from './Loader'
import StatusBadge from './StatusBadge'
import { useModuleData } from '../hooks/useModuleData'

const COLORS = ['#2dd4bf', '#38bdf8', '#a78bfa', '#facc15', '#fb7185', '#22d3ee']

export default function ChartCard({ config, paused, refreshToken }) {
  const { data, error, loading, updatedAt, refresh } = useModuleData(config.module, {
    interval: config.interval,
    paused,
    refreshToken,
  })
  const [history, setHistory] = useState([])

  const series = useMemo(() => {
    if (data === null || data === undefined) return null
    if (config.type === 'multi-line') {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, Number(value) || 0]),
      )
    }
    return { value: config.value(data) }
  }, [config, data])

  useEffect(() => {
    if (!series) return
    setHistory((current) => [...current, { at: Date.now(), values: series }].slice(-60))
  }, [series])

  const names = series ? Object.keys(series) : []
  const temperatureUnavailable = config.module === 'cpu_temp'
    && data !== null
    && normalizeTemperature(data) <= 0
  const empty = data !== null && names.length === 0
  const max = config.type === 'line' && data !== null
    ? Math.max(Number(config.max(data)) || 100, 1)
    : undefined
  const currentValue = getStatusValue(config, data)
  const tone = getTone(config.module, currentValue)
  const chartStatus = temperatureUnavailable ? 'NO SENSOR' : tone.toUpperCase()

  return (
    <DashboardCard
      heading={config.heading}
      info={config.info}
      moduleName={config.module}
      chart
      status={chartStatus}
      statusTone={temperatureUnavailable ? 'warning' : tone}
      updatedAt={updatedAt}
      onRefresh={refresh}
    >
      {loading && <Loader compact />}
      {error && <ErrorPanel message={error} />}
      {!loading && !error && temperatureUnavailable && <SensorUnavailable />}
      {!loading && !error && !temperatureUnavailable && empty && <EmptyPanel />}
      {!loading && !error && !temperatureUnavailable && !empty && (
        <div className="chart-content">
          <LiveChart
            history={history}
            max={max}
            colors={COLORS}
            threshold={config.module === 'cpu_temp' ? 70 : config.module === 'cpu_utilization' ? 75 : null}
            area={config.type === 'line'}
            unit={config.unit || (config.module === 'cpu_utilization' ? '%' : '')}
          />
          {config.module === 'current_ram' && <RamAllocation data={data} />}
          <div className="chart-metrics">
            {config.type === 'line'
              ? config.metrics(data).map(([name, value]) => (
                  <div className="chart-metric" key={name}>
                    <span>{name}</span>
                    <strong>{value}</strong>
                  </div>
                ))
              : names.map((name, index) => (
                  <div className="legend-pill" key={name}>
                    <i style={{ background: COLORS[index % COLORS.length] }} />
                    <span>{formatSeriesName(name)}</span>
                    <strong>{series[name]} {config.unit}</strong>
                  </div>
                ))}
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

function RamAllocation({ data }) {
  const percentage = data?.total ? (Number(data.used) / Number(data.total)) * 100 : 0
  const tone = percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : 'normal'
  return (
    <div className="ram-allocation">
      <div>
        <span>MEMORY ALLOCATION</span>
        <strong>{Math.round(percentage)}%</strong>
      </div>
      <i><b className={`meter-${tone}`} style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} /></i>
    </div>
  )
}

function SensorUnavailable() {
  return (
    <div className="sensor-unavailable">
      <div className="sensor-radar"><span /><i /></div>
      <StatusBadge tone="warning">SENSOR UNAVAILABLE</StatusBadge>
      <strong>Thermal telemetry offline</strong>
      <p>No valid CPU temperature was reported. Install or configure a supported hardware sensor.</p>
    </div>
  )
}

function ErrorPanel({ message }) {
  return <div className="error-panel"><strong>TELEMETRY ERROR</strong><p>{message}</p></div>
}

function EmptyPanel() {
  return <div className="empty-panel"><span>NO DATA</span><p>The module returned an empty response.</p></div>
}

function getStatusValue(config, data) {
  if (data === null || data === undefined) return NaN
  if (config.module === 'current_ram') {
    return data.total ? (Number(data.used) / Number(data.total)) * 100 : NaN
  }
  if (config.module === 'load_avg') return Math.max(...Object.values(data).map(Number).filter(Number.isFinite), 0)
  return config.type === 'line' ? Number(config.value(data)) : 0
}

function getTone(moduleName, value) {
  if (!Number.isFinite(value)) return 'muted'
  const thresholds = {
    current_ram: [75, 90],
    cpu_utilization: [70, 90],
    cpu_temp: [70, 85],
    load_avg: [70, 90],
  }[moduleName] || [75, 90]
  return value >= thresholds[1] ? 'danger' : value >= thresholds[0] ? 'warning' : 'normal'
}

function normalizeTemperature(data) {
  if (Array.isArray(data)) return Math.max(0, ...data.map(Number).filter(Number.isFinite))
  if (data && typeof data === 'object') return Math.max(0, ...Object.values(data).map(Number).filter(Number.isFinite))
  return Number(data) || 0
}

function formatSeriesName(name) {
  return name.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

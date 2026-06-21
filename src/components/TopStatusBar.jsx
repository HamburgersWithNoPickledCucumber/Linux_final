import { useMemo } from 'react'
import IconButton from './IconButton'
import StatusBadge from './StatusBadge'
import { useModuleData } from '../hooks/useModuleData'
import { useLatestModuleUpdate, useModuleSnapshot } from '../state/moduleStore'

export default function TopStatusBar({
  title,
  connection,
  paused,
  theme,
  refreshToken,
  onRefresh,
  onPause,
  onTheme,
  onSettings,
}) {
  const { data: generalInfo } = useModuleData('general_info', { refreshToken })
  const latestUpdate = useLatestModuleUpdate()
  const cpu = useModuleSnapshot('cpu_utilization').data
  const ram = useModuleSnapshot('current_ram').data
  const disk = useModuleSnapshot('disk_partitions').data
  const temp = useModuleSnapshot('cpu_temp').data

  const statuses = useMemo(() => buildStatusCluster(cpu, ram, disk, temp), [cpu, ram, disk, temp])
  const osInfo = splitOsAndKernel(generalInfo?.OS)

  return (
    <header className="command-header">
      <div className="header-title-block">
        <div className="header-kicker">
          <StatusBadge tone={connection === 'websocket' ? 'normal' : 'warning'} pulse={connection === 'websocket'}>
            {connection === 'websocket' ? 'LIVE TELEMETRY' : connection === 'http' ? 'HTTP FALLBACK' : 'CONNECTING'}
          </StatusBadge>
          <span>LINUX MONITOR</span>
        </div>
        <h1>{title}</h1>
        <div className="host-meta">
          <span><b>HOST</b>{generalInfo?.Hostname || 'detecting...'}</span>
          <span><b>OS</b>{shorten(osInfo.os)}</span>
          <span><b>KERNEL</b>{osInfo.kernel}</span>
          <span><b>UPTIME</b>{generalInfo?.Uptime || '—'}</span>
        </div>
      </div>

      <div className="header-operations">
        <div className="status-cluster" aria-label="System health">
          {statuses.map((status) => (
            <div className={`cluster-item cluster-${status.tone}`} key={status.label}>
              <span>{status.label}</span>
              <strong>{status.value}</strong>
            </div>
          ))}
        </div>
        <div className="header-controls">
          <span className="last-updated">
            <b>LAST SYNC</b>
            {latestUpdate ? new Date(latestUpdate).toLocaleTimeString([], { hour12: false }) : '--:--:--'}
          </span>
          <IconButton icon="refresh" label="Refresh all (R)" onClick={onRefresh} />
          <IconButton
            icon={paused ? 'play' : 'pause'}
            label={paused ? 'Resume updates' : 'Pause updates'}
            active={paused}
            onClick={onPause}
          />
          <IconButton icon="sun" label="Toggle theme (D)" active={theme === 'light'} onClick={onTheme} />
          <IconButton icon="settings" label="Dashboard settings" onClick={onSettings} />
        </div>
      </div>
    </header>
  )
}

function buildStatusCluster(cpu, ram, disk, temp) {
  const cpuValue = Number(cpu)
  const ramPercent = ram?.total ? (Number(ram.used) / Number(ram.total)) * 100 : null
  const rootDisk = Array.isArray(disk)
    ? disk.find((partition) => partition.mounted === '/') || disk[0]
    : null
  const diskPercent = Number.parseFloat(rootDisk?.['used%'])
  const temperature = normalizeTemperature(temp)

  return [
    status('CPU', cpuValue, [70, 90], '%'),
    status('RAM', ramPercent, [75, 90], '%'),
    status('DISK', diskPercent, [80, 92], '%'),
    temperature > 0
      ? status('TEMP', temperature, [70, 85], '°')
      : { label: 'TEMP', value: 'NO SENSOR', tone: 'warning' },
  ]
}

function status(label, value, thresholds, suffix) {
  if (!Number.isFinite(value)) return { label, value: 'WAIT', tone: 'muted' }
  const tone = value >= thresholds[1] ? 'danger' : value >= thresholds[0] ? 'warning' : 'normal'
  return { label, value: `${Math.round(value)}${suffix}`, tone }
}

function normalizeTemperature(data) {
  if (Array.isArray(data)) return Math.max(0, ...data.map(Number).filter(Number.isFinite))
  if (data && typeof data === 'object') return Math.max(0, ...Object.values(data).map(Number).filter(Number.isFinite))
  return Number(data) || 0
}

function shorten(value) {
  if (!value) return 'detecting...'
  return value.length > 34 ? `${value.slice(0, 31)}...` : value
}

function splitOsAndKernel(value) {
  if (!value) return { os: 'detecting...', kernel: '—' }
  const parts = value.trim().split(/\s+/)
  const kernelIndex = parts.findIndex((part) => /^\d+\.\d+\.\d+/.test(part))
  if (kernelIndex < 0) return { os: value, kernel: '—' }
  return {
    os: parts.slice(0, kernelIndex).join(' '),
    kernel: parts.slice(kernelIndex).join(' '),
  }
}

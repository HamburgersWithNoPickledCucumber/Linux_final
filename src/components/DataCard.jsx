import { useMemo, useState } from 'react'
import DashboardCard from './DashboardCard'
import Icon from './Icon'
import IconButton from './IconButton'
import Loader from './Loader'
import StatusBadge from './StatusBadge'
import { useModuleData } from '../hooks/useModuleData'

export default function DataCard({ config, paused, refreshToken }) {
  const { data, error, loading, updatedAt, refresh } = useModuleData(config.module, {
    paused,
    refreshToken,
  })
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ column: null, descending: false })
  const [warningsOnly, setWarningsOnly] = useState(false)
  const empty = isEmpty(data)
  const rows = Array.isArray(data) ? data : []
  const headers = rows.length ? Object.keys(rows[0]) : []

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    let result = normalizedQuery
      ? rows.filter((row) =>
          Object.values(row).some((value) => String(value).toLowerCase().includes(normalizedQuery)),
        )
      : [...rows]

    if (warningsOnly) result = result.filter(isWarningRow)
    if (sort.column) {
      result.sort((a, b) => compare(a[sort.column], b[sort.column]))
      if (sort.descending) result.reverse()
    }
    return result
  }, [query, rows, sort, warningsOnly])

  const setSortColumn = (column) => {
    setSort((current) => ({
      column,
      descending: current.column === column ? !current.descending : false,
    }))
  }

  const exportCsv = data && !empty
    ? () => downloadCsv(config.heading, buildCsv(data))
    : undefined

  const panelStatus = error ? 'ERROR' : loading ? 'SYNCING' : empty ? 'NO DATA' : `${rows.length || Object.keys(data).length} RECORDS`
  const statusTone = error ? 'danger' : empty ? 'muted' : 'normal'

  return (
    <DashboardCard
      heading={config.heading}
      info={config.info}
      moduleName={config.module}
      status={panelStatus}
      statusTone={statusTone}
      updatedAt={updatedAt}
    >
      {loading && <Loader />}
      {error && <ErrorPanel message={error} onRetry={refresh} />}
      {!loading && !error && empty && <EmptyPanel moduleName={config.module} />}
      {!loading && !error && !empty && config.type === 'table' && (
        <div className="console-table-shell">
          <div className="console-toolbar">
            <label className="console-search">
              <Icon name="search" size={14} />
              <span className="sr-only">Search {config.heading}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${rows.length} records...`}
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
            </label>
            <div className="console-toolbar-actions">
              {isProcessModule(config.module) && (
                <button
                  type="button"
                  className={`filter-chip ${warningsOnly ? 'is-active' : ''}`}
                  onClick={() => setWarningsOnly((value) => !value)}
                >
                  <Icon name="filter" size={13} /> Warnings
                </button>
              )}
              <IconButton icon="refresh" label={`Refresh ${config.heading}`} onClick={refresh} />
              {exportCsv && <IconButton icon="download" label={`Export ${config.heading} CSV`} onClick={exportCsv} />}
            </div>
          </div>
          <div className="table-scroll">
            <table className="console-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header}>
                      <button type="button" className="sort-button" onClick={() => setSortColumn(header)}>
                        {header}
                        {sort.column === header && <span>{sort.descending ? '▼' : '▲'}</span>}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    className={isWarningRow(row) ? 'warning-row' : ''}
                    key={`${config.module}-${row.pid || row.filename || index}`}
                  >
                    {headers.map((header) => (
                      <td className={cellClass(header)} key={header}>
                        <ConsoleCell header={header} value={row[header]} row={row} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredRows.length && (
              <div className="filtered-empty">No records match the current filters.</div>
            )}
          </div>
        </div>
      )}
      {!loading && !error && !empty && config.type === 'key-value' && (
        <div className="key-value-shell">
          <div className="console-toolbar compact-toolbar">
            <span className="record-count">{Object.keys(data).length} SIGNALS</span>
            <div className="console-toolbar-actions">
              <IconButton icon="refresh" label={`Refresh ${config.heading}`} onClick={refresh} />
              {exportCsv && <IconButton icon="download" label={`Export ${config.heading} CSV`} onClick={exportCsv} />}
            </div>
          </div>
          <div className="table-scroll">
            <table className="console-table key-value-table">
              <tbody>
                {Object.entries(data).map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{formatValue(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

function ConsoleCell({ header, value, row }) {
  const normalized = header.toLowerCase()
  const percent = normalized.includes('%')
    ? Number.parseFloat(value)
    : normalized === 'used' && row.size
      ? (Number(value) / Number(row.size)) * 100
      : null

  if (Number.isFinite(percent)) {
    const tone = percent >= 80 ? 'danger' : percent >= 50 ? 'warning' : 'normal'
    return (
      <div className="cell-meter">
        <span>{formatValue(value)}{normalized === 'used' ? '' : '%'}</span>
        <i><b className={`meter-${tone}`} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} /></i>
      </div>
    )
  }

  if (normalized === 'installed') {
    const installed = value === true || value === 'true' || value === 'installed'
    return <StatusBadge tone={installed ? 'normal' : 'muted'}>{installed ? 'INSTALLED' : 'MISSING'}</StatusBadge>
  }

  return <span>{formatValue(value)}</span>
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="error-panel">
      <StatusBadge tone="danger">REQUEST FAILED</StatusBadge>
      <strong>Module telemetry unavailable</strong>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Retry request</button>
    </div>
  )
}

function EmptyPanel({ moduleName }) {
  return (
    <div className="empty-panel">
      <span>NO RECORDS</span>
      <strong>{moduleName}</strong>
      <p>The module responded successfully but returned no active entries.</p>
    </div>
  )
}

function isWarningRow(row) {
  return Number(row['cpu%']) >= 50 || Number(row['mem%']) >= 50 || Number.parseFloat(row['used%']) >= 80
}

function isProcessModule(moduleName) {
  return ['cpu_intensive_processes', 'ram_intensive_processes', 'docker_processes', 'pm2_stats'].includes(moduleName)
}

function cellClass(header) {
  return ['pid', 'user', 'cmd', 'command', 'filename'].includes(header.toLowerCase()) ? 'mono-cell' : ''
}

function isEmpty(data) {
  if (data === null || data === undefined) return true
  if (Array.isArray(data)) return data.length === 0
  if (typeof data === 'object') return Object.keys(data).length === 0
  return false
}

function compare(a, b) {
  const aNumber = Number.parseFloat(a)
  const bNumber = Number.parseFloat(b)
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
}

function formatValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function buildCsv(data) {
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0] || {})
    return [
      headers.map(quoteCsv).join(','),
      ...data.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
    ].join('\n')
  }
  return ['Key,Value', ...Object.entries(data).map(([key, value]) =>
    `${quoteCsv(key)},${quoteCsv(value)}`,
  )].join('\n')
}

function quoteCsv(value) {
  return `"${formatValue(value).replaceAll('"', '""')}"`
}

function downloadCsv(name, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

import DashboardCard from './DashboardCard'
import IconButton from './IconButton'
import Loader from './Loader'
import StatusBadge from './StatusBadge'
import { useModuleData } from '../hooks/useModuleData'

export default function DiskCard({ config, paused, refreshToken }) {
  const { data, error, loading, updatedAt, refresh } = useModuleData(config.module, {
    paused,
    refreshToken,
  })
  const partitions = Array.isArray(data) ? data : []
  const highestUsage = Math.max(...partitions.map((partition) => parsePercent(partition['used%'])), 0)
  const tone = highestUsage >= 92 ? 'danger' : highestUsage >= 80 ? 'warning' : 'normal'

  return (
    <DashboardCard
      heading={config.heading}
      info="Mounted filesystems and capacity pressure."
      moduleName={config.module}
      status={loading
        ? 'SCANNING'
        : highestUsage >= 80
          ? 'CAPACITY ALERT'
          : partitions.length ? `${partitions.length} VOLUMES` : 'NO VOLUMES'}
      statusTone={tone}
      updatedAt={updatedAt}
    >
      {loading && <Loader />}
      {error && <div className="error-panel"><StatusBadge tone="danger">DISK ERROR</StatusBadge><p>{error}</p></div>}
      {!loading && !error && !partitions.length && (
        <div className="empty-panel"><span>NO VOLUMES</span><p>No mounted partitions were reported.</p></div>
      )}
      {!!partitions.length && (
        <div className="console-table-shell">
          <div className="console-toolbar compact-toolbar">
            <span className="record-count">CAPACITY MAP / {highestUsage}% PEAK</span>
            <div className="console-toolbar-actions">
              <IconButton icon="refresh" label="Refresh disk partitions" onClick={refresh} />
              <IconButton icon="download" label="Export disk partitions CSV" onClick={() => exportDiskCsv(partitions)} />
            </div>
          </div>
          <div className="table-scroll">
            <table className="console-table disk-table">
              <thead>
                <tr><th>Filesystem</th><th>Capacity</th><th>Allocation</th><th>Used</th><th>Mount</th></tr>
              </thead>
              <tbody>
                {partitions.map((partition, index) => {
                  const usage = parsePercent(partition['used%'])
                  const rowTone = usage >= 92 ? 'danger' : usage >= 80 ? 'warning' : 'normal'
                  return (
                    <tr className={rowTone !== 'normal' ? 'warning-row' : ''} key={`${partition.file_system}-${index}`}>
                      <td className="mono-cell">{partition.file_system}</td>
                      <td>
                        <div className="capacity-cell">
                          <div className="progress-track">
                            <span className={`meter-${rowTone}`} style={{ width: `${usage}%` }} />
                          </div>
                          <strong>{usage}%</strong>
                        </div>
                      </td>
                      <td>{partition.used} <span className="muted-inline">/ {partition.size}</span></td>
                      <td><StatusBadge tone={rowTone}>{partition['used%']}</StatusBadge></td>
                      <td className="mono-cell">{partition.mounted}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

function parsePercent(value) {
  return Math.min(Math.max(Number.parseFloat(value) || 0, 0), 100)
}

function exportDiskCsv(partitions) {
  const headers = Object.keys(partitions[0])
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [
    headers.map(quote).join(','),
    ...partitions.map((row) => headers.map((header) => quote(row[header])).join(',')),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'Disk Partitions.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

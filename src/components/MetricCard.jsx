import Sparkline from './Sparkline'
import StatusBadge from './StatusBadge'

export default function MetricCard({
  label,
  value,
  unit,
  description,
  tone = 'normal',
  status,
  trend,
  history,
  meta,
}) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        <StatusBadge tone={tone}>{status}</StatusBadge>
      </div>
      <div className="metric-value-row">
        <strong>{value}</strong>
        {unit && <span>{unit}</span>}
      </div>
      <p className="metric-description">{description}</p>
      <div className="metric-visual">
        <Sparkline values={history} tone={tone} />
      </div>
      <footer>
        <span className={`metric-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : ''}`}>
          {formatTrend(trend)}
        </span>
        <span>{meta}</span>
      </footer>
    </article>
  )
}

function formatTrend(trend) {
  if (!Number.isFinite(trend) || Math.abs(trend) < 0.05) return '— stable'
  return `${trend > 0 ? '↗' : '↘'} ${Math.abs(trend).toFixed(1)}%`
}

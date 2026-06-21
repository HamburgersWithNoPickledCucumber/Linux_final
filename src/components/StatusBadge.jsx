export default function StatusBadge({ tone = 'normal', children, pulse = false }) {
  return (
    <span className={`status-badge status-badge-${tone} ${pulse ? 'status-badge-pulse' : ''}`}>
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  )
}

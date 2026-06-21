export default function Loader({ compact = false }) {
  return (
    <div className={`skeleton-stack ${compact ? 'skeleton-compact' : ''}`} role="status" aria-label="Loading">
      <span className="skeleton-block skeleton-primary" />
      <span className="skeleton-block" />
      <span className="skeleton-block skeleton-short" />
    </div>
  )
}

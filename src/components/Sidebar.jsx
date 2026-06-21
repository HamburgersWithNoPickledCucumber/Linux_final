import Icon from './Icon'

const PRIMARY_NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview', page: 'system-status' },
  { id: 'system', label: 'System', icon: 'system', page: 'basic-info' },
  { id: 'network', label: 'Network', icon: 'network', page: 'network' },
  { id: 'processes', label: 'Processes', icon: 'processes', page: 'system-status', anchor: 'processes' },
  { id: 'storage', label: 'Storage', icon: 'storage', page: 'system-status', anchor: 'storage' },
  { id: 'settings', label: 'Settings', icon: 'settings', action: 'settings' },
]

const RESOURCE_NAV = [
  { id: 'accounts', label: 'Accounts', icon: 'accounts', page: 'accounts' },
  { id: 'apps', label: 'Applications', icon: 'apps', page: 'apps' },
]

export default function Sidebar({
  page,
  activeAnchor,
  collapsed,
  onNavigate,
  onToggle,
  onSettings,
}) {
  const renderItem = (item) => {
    const active = item.anchor
      ? page === item.page && activeAnchor === item.anchor
      : item.page === page && !activeAnchor

    return (
      <button
        type="button"
        className={`sidebar-link ${active ? 'is-active' : ''}`}
        key={item.id}
        onClick={() => item.action === 'settings' ? onSettings() : onNavigate(item.page, item.anchor)}
        title={collapsed ? item.label : undefined}
      >
        <Icon name={item.icon} size={18} />
        <span>{item.label}</span>
        {active && <i className="active-rail" aria-hidden="true" />}
      </button>
    )
  }

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <button type="button" className="brand-mark" onClick={() => onNavigate('system-status')}>
          <span className="brand-glyph">B</span>
          <span className="brand-copy"><strong>BOARD</strong><small>OPS CONSOLE</small></span>
        </button>
        <button type="button" className="sidebar-collapse" onClick={onToggle} aria-label="Toggle sidebar">
          <Icon name="collapse" className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <p className="sidebar-label">Command</p>
        {PRIMARY_NAV.map(renderItem)}
        <p className="sidebar-label sidebar-label-spaced">Resources</p>
        {RESOURCE_NAV.map(renderItem)}
      </nav>

      <div className="sidebar-footer">
        <div className="node-indicator"><span /><div><strong>NODE ONLINE</strong><small>LOCAL SYSTEM</small></div></div>
        <span className="version">v3.0</span>
      </div>
    </aside>
  )
}

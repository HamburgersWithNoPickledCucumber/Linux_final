import Sidebar from './Sidebar'

export default function DashboardLayout({
  children,
  page,
  activeAnchor,
  sidebarCollapsed,
  onNavigate,
  onToggleSidebar,
  onSettings,
}) {
  return (
    <div className={`dashboard-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        page={page}
        activeAnchor={activeAnchor}
        collapsed={sidebarCollapsed}
        onNavigate={onNavigate}
        onToggle={onToggleSidebar}
        onSettings={onSettings}
      />
      <div className="dashboard-surface">{children}</div>
    </div>
  )
}

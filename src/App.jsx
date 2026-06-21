import { useEffect, useMemo, useState } from 'react'
import { dashboardClient } from './api/dashboardClient'
import ChartCard from './components/ChartCard'
import DashboardLayout from './components/DashboardLayout'
import DataCard from './components/DataCard'
import DiskCard from './components/DiskCard'
import OverviewSummary from './components/OverviewSummary'
import SectionHeader from './components/SectionHeader'
import SettingsPanel from './components/SettingsPanel'
import TopStatusBar from './components/TopStatusBar'
import { DASHBOARD_PAGES, NAV_ITEMS } from './dashboardConfig'

const DEFAULT_PAGE = 'system-status'
const SYSTEM_SECTIONS = [
  {
    id: 'telemetry',
    eyebrow: '02 / TELEMETRY',
    title: 'Realtime telemetry',
    description: 'Continuous compute, memory, load, and thermal signals.',
  },
  {
    id: 'processes',
    eyebrow: '03 / RUNTIME',
    title: 'Process intelligence',
    description: 'Resource-intensive workloads and container activity.',
  },
  {
    id: 'storage',
    eyebrow: '04 / STORAGE',
    title: 'Storage topology',
    description: 'Mounted volumes, capacity pressure, and swap allocation.',
  },
  {
    id: 'alerts',
    eyebrow: '05 / HEALTH',
    title: 'System advisories',
    description: 'Service failures and pending operational maintenance.',
  },
]

export default function App() {
  const [page, setPage] = useState(getInitialPage)
  const [activeAnchor, setActiveAnchor] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [paused, setPaused] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const [connection, setConnection] = useState('connecting')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true',
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [orderedModules, setOrderedModules] = useState(() => loadOrder(getInitialPage()))
  const [draggedModule, setDraggedModule] = useState(null)

  const configs = useMemo(() => orderConfigs(DASHBOARD_PAGES[page], orderedModules), [orderedModules, page])
  const pageTitle = NAV_ITEMS.find((item) => item.id === page)?.label || 'System Status'

  useEffect(() => dashboardClient.subscribe(setConnection), [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleHash = () => {
      const nextPage = window.location.hash.replace(/^#\/?/, '')
      if (DASHBOARD_PAGES[nextPage]) {
        setPage(nextPage)
        setActiveAnchor(null)
        setOrderedModules(loadOrder(nextPage))
        localStorage.setItem('currentTab', nextPage)
      }
    }
    window.addEventListener('hashchange', handleHash)
    window.addEventListener('popstate', handleHash)
    return () => {
      window.removeEventListener('hashchange', handleHash)
      window.removeEventListener('popstate', handleHash)
    }
  }, [])

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault()
        navigate(NAV_ITEMS[Number(event.key) - 1].id)
      } else if (event.key.toLowerCase() === 'd') {
        event.preventDefault()
        toggleTheme()
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        refreshAll()
      } else if (event.key === ' ') {
        event.preventDefault()
        setPaused((value) => !value)
      } else if (event.key === 'Escape') {
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  })

  const navigate = (nextPage, anchor = null) => {
    setPage(nextPage)
    setActiveAnchor(anchor)
    setOrderedModules(loadOrder(nextPage))
    localStorage.setItem('currentTab', nextPage)
    if (window.location.hash !== `#/${nextPage}`) {
      window.history.pushState(null, '', `#/${nextPage}`)
    }
    if (anchor) {
      window.requestAnimationFrame(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const refreshAll = () => setRefreshToken((value) => value + 1)
  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark')

  const dropBefore = (targetModule) => {
    if (!draggedModule || draggedModule === targetModule) return
    setOrderedModules((current) => {
      const next = current.filter((module) => module !== draggedModule)
      const targetIndex = next.indexOf(targetModule)
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, draggedModule)
      localStorage.setItem(orderKey(page), next.join('|'))
      return next
    })
    setDraggedModule(null)
  }

  return (
    <DashboardLayout
      page={page}
      activeAnchor={activeAnchor}
      sidebarCollapsed={sidebarCollapsed}
      onNavigate={navigate}
      onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      onSettings={() => setSettingsOpen(true)}
    >
      <TopStatusBar
        title={pageTitle}
        connection={connection}
        paused={paused}
        theme={theme}
        refreshToken={refreshToken}
        onRefresh={refreshAll}
        onPause={() => setPaused((value) => !value)}
        onTheme={toggleTheme}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="dashboard-main">
        {page === DEFAULT_PAGE
          ? <SystemStatusPage
              configs={configs}
              paused={paused}
              refreshToken={refreshToken}
              draggedModule={draggedModule}
              setDraggedModule={setDraggedModule}
              dropBefore={dropBefore}
            />
          : <StandardPage
              pageTitle={pageTitle}
              configs={configs}
              paused={paused}
              refreshToken={refreshToken}
              setDraggedModule={setDraggedModule}
              dropBefore={dropBefore}
            />}
      </main>

      <SettingsPanel
        open={settingsOpen}
        theme={theme}
        onTheme={toggleTheme}
        onClose={() => setSettingsOpen(false)}
      />
    </DashboardLayout>
  )
}

function SystemStatusPage({
  configs,
  paused,
  refreshToken,
  setDraggedModule,
  dropBefore,
}) {
  return (
    <>
      <OverviewSummary />
      {SYSTEM_SECTIONS.map((section) => {
        const sectionConfigs = configs.filter((config) => config.section === section.id)
        if (!sectionConfigs.length) return null
        return (
          <section className={`dashboard-section section-${section.id}`} id={section.id} key={section.id}>
            <SectionHeader {...section} />
            <div className="module-grid">
              {sectionConfigs.map((config, index) => (
                <ModuleSlot
                  key={config.module}
                  config={config}
                  index={index}
                  paused={paused}
                  refreshToken={refreshToken}
                  setDraggedModule={setDraggedModule}
                  dropBefore={dropBefore}
                />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}

function StandardPage({
  pageTitle,
  configs,
  paused,
  refreshToken,
  setDraggedModule,
  dropBefore,
}) {
  return (
    <section className="dashboard-section standard-section">
      <SectionHeader
        eyebrow="SYSTEM MODULE"
        title={pageTitle}
        description="Live Linux system data with sortable, searchable operational detail."
      />
      <div className="module-grid">
        {configs.map((config, index) => (
          <ModuleSlot
            key={config.module}
            config={config}
            index={index}
            paused={paused}
            refreshToken={refreshToken}
            setDraggedModule={setDraggedModule}
            dropBefore={dropBefore}
          />
        ))}
      </div>
    </section>
  )
}

function ModuleSlot({
  config,
  index,
  paused,
  refreshToken,
  setDraggedModule,
  dropBefore,
}) {
  return (
    <div
      id={`module-${config.module}`}
      className={`card-slot layout-${config.layout || 'half'} module-${config.module}`}
      style={{ '--enter-delay': `${Math.min(index * 45, 260)}ms` }}
      onDragStart={() => setDraggedModule(config.module)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => dropBefore(config.module)}
    >
      <DashboardModule config={config} paused={paused} refreshToken={refreshToken} />
    </div>
  )
}

function DashboardModule(props) {
  if (props.config.type === 'line' || props.config.type === 'multi-line') {
    return <ChartCard {...props} />
  }
  if (props.config.type === 'disk') return <DiskCard {...props} />
  return <DataCard {...props} />
}

function orderConfigs(configs, orderedModules) {
  const byModule = new Map(configs.map((config) => [config.module, config]))
  const ordered = orderedModules.map((module) => byModule.get(module)).filter(Boolean)
  configs.forEach((config) => {
    if (!ordered.some((item) => item.module === config.module)) ordered.push(config)
  })
  return ordered
}

function getInitialPage() {
  const hashPage = window.location.hash.replace(/^#\/?/, '')
  const storedPage = (localStorage.getItem('currentTab') || '').replace(/^\//, '')
  return DASHBOARD_PAGES[hashPage] ? hashPage : DASHBOARD_PAGES[storedPage] ? storedPage : DEFAULT_PAGE
}

function orderKey(page) {
  return `plugin-order-v2-${page}`
}

function loadOrder(page) {
  const stored = localStorage.getItem(orderKey(page))
  return stored ? stored.split('|').filter(Boolean) : DASHBOARD_PAGES[page].map((item) => item.module)
}

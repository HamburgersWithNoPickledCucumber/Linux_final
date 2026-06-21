import { useEffect, useState } from 'react'
import IconButton from './IconButton'
import StatusBadge from './StatusBadge'

const HIDDEN_KEY = 'hiddenPlugins'

export default function DashboardCard({
  children,
  heading,
  info,
  moduleName,
  chart = false,
  status,
  statusTone = 'normal',
  updatedAt,
  onRefresh,
}) {
  const [hidden, setHidden] = useState(() => getHiddenPlugins().includes(moduleName))
  const [enlarged, setEnlarged] = useState(false)

  useEffect(() => {
    const hiddenPlugins = getHiddenPlugins()
    const next = hidden
      ? [...new Set([...hiddenPlugins, moduleName])]
      : hiddenPlugins.filter((name) => name !== moduleName)
    localStorage.setItem(HIDDEN_KEY, next.join(','))
  }, [hidden, moduleName])

  return (
    <article
      className={[
        'plugin',
        'console-panel',
        chart ? 'chart-plugin' : '',
        hidden ? 'plugin-hidden' : '',
        enlarged ? 'plugin-enlarged' : '',
      ].filter(Boolean).join(' ')}
      draggable
      data-module={moduleName}
    >
      <header className="panel-header">
        <div className="panel-heading">
          <span className="drag-handle" aria-label={`Drag ${heading}`}>⠿</span>
          <div>
            <div className="panel-title-row">
              <h3>{heading}</h3>
              {status && <StatusBadge tone={statusTone}>{status}</StatusBadge>}
            </div>
            <p>{info || `module://${moduleName}`}</p>
          </div>
        </div>
        <div className="card-actions">
          {updatedAt && !hidden && (
            <span className="panel-updated">{formatTime(updatedAt)}</span>
          )}
          {onRefresh && !hidden && (
            <IconButton icon="refresh" label={`Refresh ${heading}`} onClick={onRefresh} />
          )}
          {!chart && !hidden && (
            <IconButton
              icon="expand"
              label={`Toggle ${heading} width`}
              active={enlarged}
              onClick={() => setEnlarged((value) => !value)}
            />
          )}
          <IconButton
            icon={hidden ? 'chevron' : 'minimize'}
            label={hidden ? `Show ${heading}` : `Hide ${heading}`}
            onClick={() => setHidden((value) => !value)}
          />
        </div>
      </header>
      {!hidden && <div className="plugin-body">{children}</div>}
    </article>
  )
}

function getHiddenPlugins() {
  return (localStorage.getItem(HIDDEN_KEY) || '').split(',').filter(Boolean)
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour12: false })
}

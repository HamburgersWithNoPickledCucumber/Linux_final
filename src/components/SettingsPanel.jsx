import IconButton from './IconButton'

export default function SettingsPanel({ open, theme, onTheme, onClose }) {
  return (
    <>
      <button
        type="button"
        className={`settings-backdrop ${open ? 'is-open' : ''}`}
        aria-label="Close settings"
        onClick={onClose}
      />
      <aside className={`settings-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <header>
          <div><p>CONTROL PANEL</p><h2>Interface Settings</h2></div>
          <IconButton icon="minimize" label="Close settings" onClick={onClose} />
        </header>
        <div className="settings-content">
          <section>
            <span className="settings-label">Appearance</span>
            <button type="button" className="settings-option" onClick={onTheme}>
              <div><strong>Color theme</strong><small>Switch dashboard contrast mode</small></div>
              <span>{theme === 'dark' ? 'DARK OPS' : 'LIGHT OPS'}</span>
            </button>
          </section>
          <section>
            <span className="settings-label">Keyboard</span>
            <div className="shortcut-row"><span>Refresh telemetry</span><kbd>R</kbd></div>
            <div className="shortcut-row"><span>Pause stream</span><kbd>SPACE</kbd></div>
            <div className="shortcut-row"><span>Toggle theme</span><kbd>D</kbd></div>
          </section>
        </div>
      </aside>
    </>
  )
}

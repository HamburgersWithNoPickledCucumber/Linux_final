import { NavLink } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';
import styles from './Navbar.module.css';

const TABS = [
  { path: '/system-status', label: 'Status' },
  { path: '/basic-info', label: 'Info' },
  { path: '/network', label: 'Network' },
  { path: '/accounts', label: 'Accounts' },
  { path: '/apps', label: 'Apps' },
];

export default function Navbar() {
  const { setActiveTab } = useDashboard();

  return (
    <nav className={styles.navbar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span className={styles.brand}>Linux Board</span>
        <div className={styles.links}>
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
              onClick={() => setActiveTab(tab.path.replace('/', ''))}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className={styles.external}>
        <a href="https://github.com/afaqurk/linux-dash" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span>|</span>
        <a href="https://github.com/afaqurk/linux-dash/wiki" target="_blank" rel="noopener noreferrer">Docs</a>
      </div>
    </nav>
  );
}

import { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import Spinner from './Spinner';
import styles from './PluginCard.module.css';

export default function PluginCard({ id, title, children, loading = false, empty = false }) {
  const { isPluginHidden, togglePlugin } = useDashboard();
  const [enlarged, setEnlarged] = useState(false);

  const hidden = isPluginHidden(id);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePlugin(id);
    }
  };

  if (hidden) return null;

  if (empty) {
    return (
      <div className={`${styles.card} ${enlarged ? styles.enlarged : ''}`}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <div className={styles.actions}>
            <button
              className={styles.btn}
              onClick={() => togglePlugin(id)}
              onKeyDown={handleKeyDown}
              title="Close"
              aria-label={`Close ${title}`}
            >
              &#10005;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${enlarged ? styles.enlarged : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.actions}>
          <button
            className={styles.btn}
            onClick={() => setEnlarged(!enlarged)}
            title={enlarged ? 'Shrink' : 'Enlarge'}
            aria-label={enlarged ? `Shrink ${title}` : `Enlarge ${title}`}
          >
            {enlarged ? '\u2190' : '\u2192'}
          </button>
          <button
            className={styles.btn}
            onClick={() => togglePlugin(id)}
            onKeyDown={handleKeyDown}
            title="Close"
            aria-label={`Close ${title}`}
          >
            &#10005;
          </button>
        </div>
      </div>
      <div className={styles.body}>
        {loading ? <Spinner /> : children}
      </div>
    </div>
  );
}

import styles from './ProgressBar.module.css';

function getColor(percent) {
  if (percent > 80) return styles.red;
  if (percent > 60) return styles.yellow;
  return styles.green;
}

function parsePercent(str) {
  if (!str) return 0;
  const cleaned = String(str).replace('%', '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
}

export default function ProgressBarList({ data }) {
  if (!data || data.length === 0) {
    return <div className={styles.empty}>No data available</div>;
  }

  return (
    <div className={styles.wrap}>
      {data.map((item, i) => {
        const pct = parsePercent(item['used%']);
        return (
          <div key={i} className={styles.bar}>
            <div className={styles.barLabel}>
              <span>{item.mounted} ({item.file_system})</span>
              <span>
                {item.used} / {item.size} ({item['used%']})
              </span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${getColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

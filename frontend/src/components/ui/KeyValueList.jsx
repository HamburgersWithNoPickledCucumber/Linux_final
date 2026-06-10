import styles from './KeyValueList.module.css';

export default function KeyValueList({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div className={styles.empty}>No data available</div>;
  }

  const entries = Object.entries(data);

  return (
    <div className={styles.list}>
      {entries.map(([key, value]) => (
        <div key={key} className={styles.row}>
          <span className={styles.key}>{key}</span>
          <span className={styles.value}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

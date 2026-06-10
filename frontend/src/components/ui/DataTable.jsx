import { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

export default function DataTable({ data, metrics }) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortReverse, setSortReverse] = useState(false);
  const [search, setSearch] = useState('');

  const headers = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    const result = [...filtered].sort((a, b) => {
      const va = a[sortColumn];
      const vb = b[sortColumn];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa < sb) return -1;
      if (sa > sb) return 1;
      return 0;
    });
    return sortReverse ? result.reverse() : result;
  }, [filtered, sortColumn, sortReverse]);

  const handleSort = (col) => {
    if (col === sortColumn) {
      setSortReverse(!sortReverse);
    } else {
      setSortColumn(col);
      setSortReverse(false);
    }
  };

  if (!data || data.length === 0) {
    return <div className={styles.empty}>No data available</div>;
  }

  return (
    <div>
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Filter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} onClick={() => handleSort(h)}>
                  {h}
                  {sortColumn === h && (
                    <span className={styles.sortIcon}>
                      {sortReverse ? '\u25B2' : '\u25BC'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i}>
                {headers.map((h) => (
                  <td key={h}>
                    {row[h] != null ? String(row[h]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {metrics && metrics.length > 0 && (
        <div className={styles.metrics}>
          {metrics.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

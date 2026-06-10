import { useServer } from '../../context/ServerContext';
import { useState, useEffect } from 'react';
import PluginCard from '../ui/PluginCard';
import ProgressBarList from '../ui/ProgressBar';

export default function DiskSpace() {
  const { fetchOnce } = useServer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnce('disk_partitions', (resp) => {
      setData(resp);
      setLoading(false);
    });
  }, []);

  return (
    <PluginCard id="disk-space" title="Disk Partitions" loading={loading}>
      {data && <ProgressBarList data={data} />}
    </PluginCard>
  );
}

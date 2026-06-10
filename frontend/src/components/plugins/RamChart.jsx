import { useState, useEffect } from 'react';
import { useServer } from '../../context/ServerContext';
import PluginCard from '../ui/PluginCard';
import LineChart from '../ui/LineChart';

export default function RamChart() {
  const [maxRam, setMaxRam] = useState(null);
  const { fetchOnce } = useServer();

  useEffect(() => {
    fetchOnce('current_ram', (resp) => {
      if (resp) setMaxRam(resp.total);
    });
  }, []);

  const humanizeRam = (ramInMB) => {
    const ram = parseInt(ramInMB, 10);
    if (ram > 1000) return (ram / 1024).toFixed(2) + ' GB';
    return ram + ' MB';
  };

  const metrics = [
    {
      name: 'Used',
      generate: (data) => {
        const ratio = data.used / data.total;
        const pct = Math.round(ratio * 100);
        return humanizeRam(data.used) + ' (' + pct + '%)';
      },
    },
    {
      name: 'Available',
      generate: (data) => humanizeRam(data.available) + ' of ' + humanizeRam(data.total),
    },
  ];

  return (
    <PluginCard id="ram-chart" title="RAM Usage" loading={!maxRam}>
      {maxRam && (
        <LineChart
          moduleName="current_ram"
          maxValue={maxRam}
          minValue={0}
          refreshRate={1000}
          getDisplayValue={(d) => d.used}
          metrics={metrics}
        />
      )}
    </PluginCard>
  );
}

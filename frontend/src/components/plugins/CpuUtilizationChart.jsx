import PluginCard from '../ui/PluginCard';
import LineChart from '../ui/LineChart';

export default function CpuUtilizationChart() {
  const metrics = [
    { name: 'Usage', generate: (d) => d + ' %' },
  ];

  return (
    <PluginCard id="cpu-util" title="CPU Utilization">
      <LineChart
        moduleName="cpu_utilization"
        maxValue={100}
        minValue={0}
        refreshRate={1500}
        getDisplayValue={(d) => d}
        metrics={metrics}
      />
    </PluginCard>
  );
}

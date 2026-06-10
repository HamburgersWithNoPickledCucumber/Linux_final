import PluginCard from '../ui/PluginCard';
import LineChart from '../ui/LineChart';

export default function CpuTemp() {
  const metrics = [
    { name: 'Temperature', generate: (d) => d + ' \u00B0C' },
  ];

  return (
    <PluginCard id="cpu-temp" title="CPU Temperature">
      <LineChart
        moduleName="cpu_temp"
        maxValue={100}
        minValue={0}
        refreshRate={1500}
        getDisplayValue={(d) => d}
        metrics={metrics}
      />
    </PluginCard>
  );
}

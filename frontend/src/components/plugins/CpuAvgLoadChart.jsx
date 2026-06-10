import PluginCard from '../ui/PluginCard';
import MultiLineChart from '../ui/MultiLineChart';

export default function CpuAvgLoadChart() {
  return (
    <PluginCard id="cpu-avg-load" title="CPU Avg Load">
      <MultiLineChart moduleName="load_avg" units="%" />
    </PluginCard>
  );
}

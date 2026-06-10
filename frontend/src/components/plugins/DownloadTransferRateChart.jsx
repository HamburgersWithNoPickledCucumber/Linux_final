import PluginCard from '../ui/PluginCard';
import MultiLineChart from '../ui/MultiLineChart';

export default function DownloadTransferRateChart() {
  return (
    <PluginCard id="download" title="Download Transfer Rate">
      <MultiLineChart moduleName="download_transfer_rate" units="KB/s" delay={2000} />
    </PluginCard>
  );
}

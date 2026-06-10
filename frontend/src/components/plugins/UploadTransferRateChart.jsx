import PluginCard from '../ui/PluginCard';
import MultiLineChart from '../ui/MultiLineChart';

export default function UploadTransferRateChart() {
  return (
    <PluginCard id="upload" title="Upload Transfer Rate">
      <MultiLineChart moduleName="upload_transfer_rate" units="KB/s" delay={2000} />
    </PluginCard>
  );
}

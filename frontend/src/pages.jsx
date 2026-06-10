import { simpleTableModules } from './components/plugins/pluginConfig';
import SimplePlugin from './components/plugins/SimplePlugin';
import RamChart from './components/plugins/RamChart';
import CpuAvgLoadChart from './components/plugins/CpuAvgLoadChart';
import CpuUtilizationChart from './components/plugins/CpuUtilizationChart';
import CpuTemp from './components/plugins/CpuTemp';
import DiskSpace from './components/plugins/DiskSpace';
import DownloadTransferRateChart from './components/plugins/DownloadTransferRateChart';
import UploadTransferRateChart from './components/plugins/UploadTransferRateChart';
import PluginGrid from './components/layout/PluginGrid';

function getSimplePlugin(name) {
  const config = simpleTableModules.find((m) => m.name === name);
  if (!config) return null;
  return <SimplePlugin key={name} id={name} config={config} />;
}

export function SystemStatus() {
  return (
    <PluginGrid tab="system-status">
      <RamChart key="ram-chart" />
      <CpuAvgLoadChart key="cpu-avg-load" />
      <CpuUtilizationChart key="cpu-util" />
      <CpuTemp key="cpu-temp" />
      {getSimplePlugin('ramIntensiveProcesses')}
      {getSimplePlugin('cpuIntensiveProcesses')}
      <DiskSpace key="disk-space" />
      {getSimplePlugin('swapUsage')}
      {getSimplePlugin('dockerProcesses')}
    </PluginGrid>
  );
}

export function BasicInfo() {
  return (
    <PluginGrid tab="basic-info">
      {getSimplePlugin('machineInfo')}
      {getSimplePlugin('memoryInfo')}
      {getSimplePlugin('cpuInfo')}
      {getSimplePlugin('scheduledCrons')}
      {getSimplePlugin('cronHistory')}
      {getSimplePlugin('ioStats')}
    </PluginGrid>
  );
}

export function Network() {
  return (
    <PluginGrid tab="network">
      <UploadTransferRateChart key="upload" />
      <DownloadTransferRateChart key="download" />
      {getSimplePlugin('ipAddresses')}
      {getSimplePlugin('networkConnections')}
      {getSimplePlugin('arpCacheTable')}
      {getSimplePlugin('pingSpeeds')}
      {getSimplePlugin('bandwidth')}
    </PluginGrid>
  );
}

export function Accounts() {
  return (
    <PluginGrid tab="accounts">
      {getSimplePlugin('serverAccounts')}
      {getSimplePlugin('loggedInAccounts')}
      {getSimplePlugin('recentLogins')}
    </PluginGrid>
  );
}

export function Apps() {
  return (
    <PluginGrid tab="apps">
      {getSimplePlugin('commonApplications')}
      {getSimplePlugin('memcached')}
      {getSimplePlugin('redis')}
      {getSimplePlugin('pm2')}
    </PluginGrid>
  );
}

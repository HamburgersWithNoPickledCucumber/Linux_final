export const NAV_ITEMS = [
  { id: 'system-status', label: 'System Status' },
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'network', label: 'Network' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'apps', label: 'Apps' },
]

export const DASHBOARD_PAGES = {
  'system-status': [
    {
      type: 'line',
      module: 'cpu_utilization',
      heading: 'CPU Utilization',
      section: 'telemetry',
      layout: 'featured',
      interval: 1500,
      value: Number,
      max: () => 100,
      metrics: (data) => [['Usage', `${data} %`]],
    },
    {
      type: 'line',
      module: 'cpu_temp',
      heading: 'CPU Temperature',
      section: 'telemetry',
      layout: 'compact',
      interval: 1500,
      value: normalizeTemperature,
      max: () => 100,
      metrics: (data) => [['Temperature', `${normalizeTemperature(data)} °C`]],
    },
    {
      type: 'line',
      module: 'current_ram',
      heading: 'RAM Usage',
      section: 'telemetry',
      layout: 'half',
      interval: 1000,
      value: (data) => Number(data.used),
      max: (data) => Number(data.total),
      metrics: (data) => {
        const percent = data.total ? Math.round((data.used / data.total) * 100) : 0
        return [
          ['Used', `${formatMemory(data.used)} (${percent}%)`],
          ['Available', `${formatMemory(data.available)} of ${formatMemory(data.total)}`],
        ]
      },
    },
    {
      type: 'multi-line',
      module: 'load_avg',
      heading: 'CPU Avg Load',
      section: 'telemetry',
      layout: 'half',
      interval: 1000,
      unit: '',
    },
    table('ram_intensive_processes', 'RAM Processes', 'Processes using the most RAM.', 'processes', 'half'),
    table('cpu_intensive_processes', 'CPU Processes', 'Processes using the most CPU.', 'processes', 'half'),
    { type: 'disk', module: 'disk_partitions', heading: 'Disk Partitions', section: 'storage', layout: 'wide' },
    table('swap', 'Swap Usage', '', 'storage', 'compact'),
    table('docker_processes', 'Docker Processes', 'Processes in Docker containers sorted by CPU.', 'processes', 'full'),
    keyValue('pending_updates', 'Pending Updates', 'Number of available system updates.', 'alerts', 'compact'),
    table('systemd_failed', 'Failed Systemd Services', 'Systemd units in a failed state.', 'alerts', 'wide'),
  ],
  'basic-info': [
    keyValue('general_info', 'General Info', 'System information.'),
    keyValue('memory_info', 'Memory Info', '/proc/meminfo read-out.'),
    keyValue('cpu_info', 'CPU Info', '/usr/bin/lscpu read-out.'),
    table('scheduled_crons', 'Scheduled Cron Jobs', 'Crons for all users on the server.'),
    table('cron_history', 'Cron Job History', 'Crons which have run recently.'),
    table('io_stats', 'IO Stats', '/proc/diskstats read-out.'),
    keyValue('firewall_overview', 'Firewall Overview', 'iptables chains and default policies.'),
    table('ssl_certificates', 'SSL Certificates', 'SSL certificate expiry dates.'),
  ],
  network: [
    {
      type: 'multi-line',
      module: 'upload_transfer_rate',
      heading: 'Upload Transfer Rate',
      interval: 1000,
      unit: 'KB/s',
    },
    {
      type: 'multi-line',
      module: 'download_transfer_rate',
      heading: 'Download Transfer Rate',
      interval: 1000,
      unit: 'KB/s',
    },
    table('ip_addresses', 'IP Addresses', 'IPs assigned to this server.'),
    table('network_connections', 'Network Connections'),
    table('arp_cache', 'ARP Cache Table'),
    table('ping', 'Ping Speeds', 'Ping speed in milliseconds.'),
    table('bandwidth', 'Bandwidth'),
  ],
  accounts: [
    table('user_accounts', 'Accounts', 'User accounts on this server.'),
    table('logged_in_users', 'Logged In Accounts', 'Users currently logged in.'),
    table('recent_account_logins', 'Recent Logins', 'Recent user sessions.'),
  ],
  apps: [
    table('common_applications', 'Common Applications', 'Commonly installed applications.'),
    keyValue('memcached', 'Memcached'),
    keyValue('redis', 'Redis'),
    table('pm2_stats', 'PM2', 'Process Manager 2 stats.'),
  ],
}

function table(module, heading, info = '', section = 'details', layout = 'half') {
  return { type: 'table', module, heading, info, section, layout }
}

function keyValue(module, heading, info = '', section = 'details', layout = 'half') {
  return { type: 'key-value', module, heading, info, section, layout }
}

function formatMemory(value) {
  const megabytes = Number(value)
  if (!Number.isFinite(megabytes)) return '-'
  return megabytes > 1000 ? `${(megabytes / 1024).toFixed(2)} GB` : `${Math.round(megabytes)} MB`
}

function normalizeTemperature(data) {
  if (Array.isArray(data)) {
    const values = data.map(Number).filter(Number.isFinite)
    return values.length ? Math.max(...values) : 0
  }
  if (data && typeof data === 'object') {
    const values = Object.values(data).map(Number).filter(Number.isFinite)
    return values.length ? Math.max(...values) : 0
  }
  return Number(data) || 0
}

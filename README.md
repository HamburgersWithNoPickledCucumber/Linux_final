# Linux Dash

A lightweight, real-time Linux server monitoring web dashboard. Built with Node.js, AngularJS, and Bash — no database, no agent installation required.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Backend Architecture](#3-backend-architecture)
4. [Shell API Layer (`linux_json_api.sh`)](#4-shell-api-layer-linux_json_apish)
5. [Module Reference Table](#5-module-reference-table)
6. [Frontend Architecture](#6-frontend-architecture)
7. [API Call Flow](#7-api-call-flow)
8. [Features Added in This Fork](#8-features-added-in-this-fork)
9. [How to Run](#9-how-to-run)

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | AngularJS 1.3 (SPA), SmoothieCharts (real-time line charts), SortableJS (drag & drop), HTML5 Canvas |
| **Backend** | Node.js, Express, WebSocket (`websocket` module) |
| **System Interface** | Bash — shell script reads `/proc`, `/sys`, `systemctl`, `iptables`, `yum`, `openssl` |
| **Build** | Gulp (concat + minify), template cache inlining |
| **Styling** | CSS3 with Custom Properties (variables) for light/dark theme |

---

## 2. Project Structure

```
Linux_final/
├── app/                          # Production build output (served to browser)
│   ├── index.html                # Main HTML (production, ng-app="linuxDash")
│   ├── linuxDash.min.js          # Concatenated & minified JS bundle (270 KB)
│   ├── linuxDash.min.css         # Concatenated & minified CSS (10 KB)
│   └── server/                   # Backend server code
│       ├── index.js              # Node.js Express + WebSocket server
│       ├── linux_json_api.sh     # Bash script: 27 system monitoring modules
│       └── config/
│           └── ping_hosts        # Target hosts for ping module
├── src/                          # Source code (unminified)
│   ├── css/                      # Global CSS (main, buttons, tables, containers)
│   ├── js/core/                  # AngularJS core (app, routes, server service)
│   │   └── features/             # Reusable UI components (plugin, table, chart, etc.)
│   └── js/plugins/               # Dashboard plugin directives
├── node_modules/                 # npm dependencies
├── index.html                    # Demo HTML (ng-app="linuxDashDemo", mock data)
├── demo.js                       # Angular $httpBackend mock for offline demo
├── gulpfile.js                   # Gulp build pipeline
└── package.json
```

**Key distinction:** `index.html` (root) is the **demo** page using mock data. `app/index.html` is the **production** page served by the Node.js server.

---

## 3. Backend Architecture

### 3.1 Express Server (`app/server/index.js`)

```
Browser                          Node.js Server                    Linux OS
───────                          ──────────────                    ────────
  │                                  │                                │
  │  HTTP GET /                      │                                │
  │ ─────────────────────────────>   │  sendFile('app/index.html')    │
  │  <─ HTML Page ──────────────────│                                │
  │                                  │                                │
  │  HTTP GET /websocket             │                                │
  │ ─────────────────────────────>   │  {websocket_support: true}     │
  │                                  │                                │
  │  WebSocket connect               │                                │
  │ ─────────────────────────────>   │                                │
  │                                  │                                │
  │  WebSocket: send("current_ram")  │                                │
  │ ─────────────────────────────>   │  spawn('linux_json_api.sh',   │
  │                                  │    ['current_ram'])            │
  │                                  │ ───────────────────────────>  │
  │                                  │        ↓                      │
  │                                  │   reads /proc/meminfo          │
  │                                  │        ↓                      │
  │                                  │   stdout: JSON string          │
  │                                  │ <───────────────────────────  │
  │                                  │                                │
  │  WebSocket: JSON response        │  JSON.stringify({             │
  │ <─────────────────────────────   │    moduleName, output })       │
  │                                  │                                │
```

**Key code:** `getPluginData()` function in `index.js`:

```javascript
function getPluginData(pluginName, callback) {
  var command = spawn(nixJsonAPIScript, [ pluginName, '' ])
  var output  = []

  command.stdout.on('data', function(chunk) {
    output.push(chunk.toString())
  })

  command.on('close', function (code) {
    callback(code, output)
  })
}
```

### 3.2 WebSocket Communication

The server uses the `websocket` npm module. Each client message contains a **module name** string (e.g. `"current_ram"`). The server spawns the shell script with that module name, collects stdout, and sends back a JSON object:

```json
{
  "moduleName": "current_ram",
  "output": "{\"total\":7618.72,\"used\":5845.22,\"available\":1773.5}"
}
```

**Critical fix applied:** The original code built this JSON using hand-rolled string concatenation (`'{"moduleName":"' + name + '","output":"' + output + '"}'`), which broke on any shell output containing double quotes. We replaced it with `JSON.stringify()`.

### 3.3 HTTP Backup

If WebSocket is unavailable, the frontend falls back to REST:
```
GET /server/?module=current_ram
```
Returns the raw shell script stdout as the HTTP response body.

---

## 4. Shell API Layer (`linux_json_api.sh`)

### 4.1 How It Works

`linux_json_api.sh` is a **function dispatch engine**. Each Linux monitoring metric is a named Bash function:

```bash
fnCalled="$1"

if [ -n "$(type -t $fnCalled)" ] && [ "$(type -t $fnCalled)" = function ]; then
    ${fnCalled}
else
    echo '{"success":false,"status":"Invalid module"}'
fi
```

When Node.js calls `spawn('linux_json_api.sh', ['current_ram'])`, the script:
1. Receives `current_ram` as `$1`
2. Checks if a function named `current_ram` exists
3. Executes it — the function prints JSON to stdout

### 4.2 How It Reads Linux System Data

Each function uses standard Linux tools to read system information:

| Data Source | Modules |
|-------------|---------|
| `/proc/meminfo` | `current_ram`, `memory_info` |
| `/proc/stat` | `cpu_utilization` |
| `/proc/loadavg` | `load_avg` |
| `/proc/cpuinfo` | `cpu_info`, `number_of_cpu_cores`, `load_avg` |
| `/proc/net/dev` | `bandwidth` |
| `/proc/diskstats` | `io_stats` |
| `/proc/swaps` | `swap` |
| `/proc/uptime` | `general_info` |
| `/sys/class/net/*/statistics/*` | `download_transfer_rate`, `upload_transfer_rate` |
| `/sys/class/thermal/thermal_zone0/temp` | `cpu_temp` |
| `systemctl` command | `systemd_failed` |
| `iptables` command | `firewall_overview` |
| `yum check-update` | `pending_updates` |
| `openssl x509` | `ssl_certificates` |
| `ps` command | `cpu_intensive_processes`, `ram_intensive_processes` |
| `df` command | `disk_partitions` |
| `netstat` command | `network_connections` |
| `ifconfig` / `dig` | `ip_addresses` |
| `ping` command | `ping` |
| `lastlog` command | `recent_account_logins` |
| `w` command | `logged_in_users` |
| `crontab` / `cron.d` | `scheduled_crons` |
| `/var/log/syslog` | `cron_history` |
| `whereis` command | `common_applications` |
| `lscpu` command | `cpu_info` |
| `sensors` command | `cpu_temp` |
| `docker` command | `docker_processes` |
| `pm2` command | `pm2_stats` |
| `redis-cli` command | `redis` |
| `nc` (netcat) | `memcached` |

**Example — `current_ram` function:**

```bash
current_ram() {
  local memInfoFile="/proc/meminfo"
  memInfo=$($CAT $memInfoFile | $GREP 'MemTotal\|MemFree\|Buffers\|Cached')

  $ECHO $memInfo | $AWK '{print
    "{ \"total\": " ($2/1024)
    ", \"used\": " ( ($2-($5+$8+$11))/1024 )
    ", \"available\": " (($5+$8+$11)/1024) " }"
  }' | _parseAndPrint
}
```

This reads `/proc/meminfo`, extracts key lines, performs arithmetic to compute total/used/available RAM in MB, then outputs a JSON object.

### 4.3 JSON Output Format

Every shell function outputs **one line of valid JSON** via the `_parseAndPrint` helper. Two output types are used:

- **Object** (single-value or key-value): `{"total": 7618.72, "used": 5845.22, ...}`
- **Array** (list of records): `[{"unit":"vboxdrv.service","load":"loaded",...}, ...]`
- **Scalar** (only `cpu_utilization`): `25`

---

## 5. Module Reference Table

### System Status (page 1)

| Module Name | Description | Data Source | Display Type |
|-------------|-------------|-------------|-------------|
| `current_ram` | RAM usage (total/used/available) | `/proc/meminfo` | Line chart |
| `load_avg` | CPU load average (1/5/15 min) | `/proc/loadavg` | Multi-line chart |
| `cpu_utilization` | CPU utilization % | `/proc/stat` | Line chart |
| `cpu_temp` | CPU temperature | `sensors` / thermal zone | Line chart |
| `ram_intensive_processes` | Top RAM-consuming processes | `ps` | Table |
| `cpu_intensive_processes` | Top CPU-consuming processes | `ps` | Table |
| `disk_partitions` | Disk usage per partition | `df` | Table + Progress bar |
| `swap` | Swap usage | `/proc/swaps` | Table |
| `docker_processes` | Docker container processes | `docker` | Table |
| `pending_updates` ★ | Available yum updates | `yum check-update` | Key-Value |
| `systemd_failed` ★ | Failed systemd units | `systemctl` | Table |

★ = Added in this fork

### Basic Info (page 2)

| Module Name | Description | Data Source |
|-------------|-------------|-------------|
| `general_info` | OS, hostname, uptime, server time | `lsb_release`, `uname`, `hostname`, `/proc/uptime` |
| `memory_info` | Full `/proc/meminfo` dump | `/proc/meminfo` |
| `cpu_info` | CPU architecture details | `lscpu` |
| `scheduled_crons` | All crontabs on the server | `/etc/crontab`, `/etc/cron.d`, user crontabs |
| `cron_history` | Recent cron job log | `/var/log/syslog` |
| `io_stats` | Disk I/O statistics | `/proc/diskstats` |
| `firewall_overview` ★ | iptables chains/rules/policies | `iptables` |
| `ssl_certificates` ★ | SSL certificate paths and expiry dates | `openssl x509` |

### Network (page 3)

| Module Name | Description | Data Source |
|-------------|-------------|-------------|
| `download_transfer_rate` | Download speed per interface (KB/s) | `/sys/class/net/*/statistics/rx_bytes` |
| `upload_transfer_rate` | Upload speed per interface (KB/s) | `/sys/class/net/*/statistics/tx_bytes` |
| `ip_addresses` | Local + external IP addresses | `ifconfig`, `dig` |
| `network_connections` | Active TCP/UDP connections | `netstat` |
| `arp_cache` | ARP cache table | `arp` |
| `ping` | Ping latencies to configured hosts | `ping` |
| `bandwidth` | Total TX/RX bytes per interface | `/proc/net/dev` |

### Accounts (page 4)

| Module Name | Description |
|-------------|-------------|
| `user_accounts` | All user accounts (system + user) |
| `logged_in_users` | Currently logged-in sessions |
| `recent_account_logins` | User login history (365 days) |

### Apps (page 5)

| Module Name | Description |
|-------------|-------------|
| `common_applications` | Installed status of common dev tools |
| `memcached` | Memcached stats |
| `redis` | Redis info |
| `pm2_stats` | PM2 process list |

---

## 6. Frontend Architecture

### 6.1 AngularJS SPA Structure

```
Angular App: linuxDash (ng-app="linuxDash")
  │
  ├── ngRoute ($routeProvider)
  │   ├── /system-status   (RAM, CPU, processes, disk, swap, docker, pending, systemd)
  │   ├── /basic-info      (machine, memory, CPU, crons, IO, firewall, SSL)
  │   ├── /network         (transfer rates, IPs, connections, ARP, ping, bandwidth)
  │   ├── /accounts        (users, logins, recent sessions)
  │   ├── /apps            (common apps, memcached, redis, pm2)
  │   └── /loading         (spinner)
  │
  ├── server service (server.service.js)
  │   ├── WebSocket (primary)
  │   │   └── $broadcast("start-linux-dash") on connect
  │   ├── $http fallback (/server/?module=xxx)
  │   ├── Pause/Resume toggle (pause all WS/HTTP requests)
  │   └── WebSocket onmessage → JSON.parse → callback(moduleData)
  │
  ├── Plugin system
  │   ├── <plugin> directive (transclude, header, body, toggle, export)
  │   ├── <top-bar> directive (heading, minimize, resize, refresh, export)
  │   ├── <key-value-list> (for single-object data → table view)
  │   ├── <table-data> (for array data → sortable table + search)
  │   ├── <line-chart-plugin> (SmoothieChart single line)
  │   ├── <multi-line-chart-plugin> (SmoothieChart multi-line)
  │   └── <progress-bar-plugin> (horizontal progress bar)
  │
  └── Keyboard shortcuts (added)
      ├── 1-5: switch tabs
      ├── D: toggle light/dark theme
      ├── R: refresh all plugins
      └── Space: pause/resume data refresh
```

### 6.2 Plugin Directive System

Each dashboard widget wraps itself in a `<plugin>` directive which provides:

- **Top bar** with heading, minimize button (-), resize button (↔), refresh button (↺), CSV export button (⬇)
- **Drag handle** (SortableJS) — users can reorder plugins, order persists in `localStorage`
- **Auto-hide** — plugins with empty results are hidden automatically

```html
<!-- Example: RAM chart plugin -->
<ram-chart sortablejs-id="ram-chart"></ram-chart>

<!-- Expands to: -->
<plugin>
  <top-bar heading="RAM Usage" ...></top-bar>
  <line-chart-plugin
    module-name="current_ram"
    refresh-rate="1000"
    max-value="maxRam"
    color="0,255,0">
  </line-chart-plugin>
</plugin>
```

### 6.3 Chart Engine (SmoothieCharts)

SmoothieCharts is a JavaScript library that renders scrolling real-time line charts on HTML5 Canvas. Each line chart directive:

1. Creates a `SmoothieChart` instance (with dark theme colors)
2. Binds a `TimeSeries` to it
3. Uses Angular's `$interval` to call `server.get(moduleName, callback)` periodically (every 1000-1500ms)
4. On data arrival, appends the new value to the `TimeSeries`
5. Changes line color based on value thresholds (green → yellow → orange)

### 6.4 Data Display Components

| Component | When to Use | Example Modules |
|-----------|-------------|-----------------|
| `key-value-list` | Backend returns a **single object** | `general_info`, `cpu_info`, `pending_updates`, `firewall_overview` |
| `table-data` | Backend returns an **array of objects** | `ram_intensive_processes`, `ssl_certificates`, `systemd_failed` |
| `line-chart-plugin` | Single numeric value over time | `current_ram`, `cpu_utilization`, `cpu_temp` |
| `multi-line-chart-plugin` | Multiple numeric values over time | `load_avg`, `download_transfer_rate`, `upload_transfer_rate` |
| `progress-bar-plugin` | Percentage visualization | `disk_partitions` |

---

## 7. API Call Flow

### End-to-end example: `current_ram` displayed as a line chart

```
1. Angular starts
   app.js → $location.path('/loading')
          → start-linux-dash event → $location.path('/system-status')

2. Routes load plugin directives
   <ram-chart> directive template:
     <line-chart-plugin module-name="current_ram" refresh-rate="1000" ...>

3. line-chart directive link()
   → $interval(scope.getData, 1000)

4. Every 1000ms: scope.getData() called
   → server.get('current_ram', callback)

5. server.service.js
   → IF WebSocket connected:
       websocket.connection.send('current_ram')
   → ELSE (HTTP fallback):
       $http.get('/server/?module=current_ram')

6. Node.js server (app/server/index.js)
   → wsClient.on('message', function(wsReq) {
       moduleName = 'current_ram'
       getPluginData('current_ram', sendDataToClient)
     })

7. getPluginData()
   → spawn('linux_json_api.sh', ['current_ram', ''])

8. linux_json_api.sh
   → fnCalled = 'current_ram'
   → type -t current_ram → 'function' ✓
   → executes current_ram()
     → cat /proc/meminfo | grep MemTotal|MemFree|Buffers|Cached
     → awk calculates: total/1024, (total-(free+buffers+cached))/1024, (free+buffers+cached)/1024
     → outputs: { "total": 7618.72, "used": 5845.22, "available": 1773.5 }

9. Node.js receives stdout via command.stdout.on('data')
   → sendDataToClient(exitCode, stdoutChunks)
   → JSON.stringify({ moduleName: 'current_ram', output: '{"total":7618.72,...}' })
   → wsClient.sendUTF(wsResponse)

10. Browser WebSocket onmessage
    → outer = JSON.parse(event.data)
    → moduleName = outer.moduleName = 'current_ram'
    → moduleData = JSON.parse(outer.output) = {total: 7618.72, used: 5845.22, available: 1773.5}

11. line-chart callback(moduleData)
    → scope.getDisplayValue(moduleData) → moduleData.used = 5845.22
    → series.append(Date.now(), 5845.22)
    → SmoothieCharts redraws the canvas line chart
```

---

## 8. Features Added in This Fork

### 8.1 WebSocket JSON Fix
- **Problem:** Original code used hand-rolled JSON string concatenation. Shell output containing double quotes (which is all modules except `cpu_utilization`) broke the JSON structure.
- **Fix:** Replaced with `JSON.stringify()` in `app/server/index.js` line 58.

### 8.2 Light/Dark Theme Toggle
- **Implementation:** CSS Custom Properties (variables) with two themes defined in `:root` and `[data-theme="light"]`.
- **10 CSS files** refactored to use `var(--bg)`, `var(--text)`, `var(--accent)`, etc.
- **Toggle button** in navbar (☀/🌙), persisted in `localStorage`.
- **Keyboard shortcut:** `D` key.

### 8.3 New Backend Modules (4 added)
| Module | Shell Command | Frontend Display |
|--------|--------------|-----------------|
| `pending_updates` | `yum check-update` | Key-Value list |
| `systemd_failed` | `systemctl list-units --state=failed` | Table |
| `firewall_overview` | `iptables -L -n` | Key-Value list |
| `ssl_certificates` | `openssl x509` (scans /etc/ssl, /etc/pki) | Table |

### 8.4 Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `1`-`5` | Switch tabs |
| `D` | Toggle light/dark theme |
| `R` | Refresh all plugins |
| `Space` | Pause/Resume data refresh |

### 8.5 Auto-Refresh Pause/Resume
- Navbar ▶/⏸ toggle button stops all WebSocket and HTTP requests when paused.
- On resume, all plugins receive `refresh-all-plugins` event and immediately re-fetch data.
- Chart plugins' `dataCallInProgress` guard is reset to prevent deadlock.

### 8.6 CSV Export
- Every table and key-value plugin has a ⬇ download button in its top bar.
- Downloads current data as a `.csv` file using `Blob` + `URL.createObjectURL`.

### 8.7 Plugin Order Persistence
- SortableJS drag & drop order is stored in `localStorage` per-tab, automatically restored on page reload.
- (This feature existed in the original codebase, verified functional.)

---

## 9. How to Run

### Prerequisites
- **Node.js** (built and tested on v22)
- **npm**
- A **Linux** server (or VM) — the shell script reads `/proc`, `/sys`, and runs system commands

### Installation

```bash
# Clone the repository
git clone git@github.com:HamburgersWithNoPickledCucumber/Linux_final.git
cd Linux_final

# Install dependencies
npm install
```

### Start the Server

```bash
# Kill any process on port 8080, then start
fuser -k 8080/tcp
LINUX_DASH_SERVER_PORT=8080 node app/server/index.js
```

Open **http://localhost:8080** in your browser.

### Demo Mode (Offline / No Server)

Open `index.html` directly in a browser (uses Angular `$httpBackend` mock data in `demo.js`).

### Build (Optional)

The pre-built `app/linuxDash.min.js` and `app/linuxDash.min.css` are included in the repository. If you modify source files, rebuild with the helper script:

```bash
# Template cache + concatenate all JS files
node build.js
```

> **Note:** The original Gulp build pipeline (`npx gulp build`) is incompatible with Node.js v22 due to the `primordials` issue. We use a Node.js build script as a replacement.
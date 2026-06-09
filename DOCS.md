# Linux Dash — Full Documentation

> **A simple, low-overhead web dashboard for monitoring Linux servers.**

**Version:** 2.0  
**License:** MIT  
**Repository:** https://github.com/HamburgersWithNoPickledCucumber/Linux_final

---

## Table of Contents

1. [What is Linux Dash?](#1-what-is-linux-dash)
2. [How It Works (The Big Picture)](#2-how-it-works-the-big-picture)
3. [Project File Structure](#3-project-file-structure)
4. [The Server Layer (Backend)](#4-the-server-layer-backend)
   - 4.1 [The Shell API Script — `linux_json_api.sh`](#41-the-shell-api-script--linux_json_apish)
   - 4.2 [The Python Server — `index.py`](#42-the-python-server--indexpy)
   - 4.3 [The Node.js Server — `index.js`](#43-the-nodejs-server--indexjs)
   - 4.4 [Other Servers (Go, PHP)](#44-other-servers-go-php)
5. [The Frontend (AngularJS)](#5-the-frontend-angularjs)
   - 5.1 [App Boot Sequence](#51-app-boot-sequence)
   - 5.2 [Tab Routing — `routes.js`](#52-tab-routing--routesjs)
   - 5.3 [Data Fetching — `server.service.js`](#53-data-fetching--serverservicejs)
   - 5.4 [Navigation Bar — `navbar.directive.js`](#54-navigation-bar--navbardirectivejs)
6. [Core UI Components (Plugins)](#6-core-ui-components-plugins)
   - 6.1 [Plugin Wrapper — `plugin.directive.js`](#61-plugin-wrapper--plugindirectivejs)
   - 6.2 [Line Chart — `line-chart-plugin.directive.js`](#62-line-chart--line-chart-plugindirectivejs)
   - 6.3 [Multi-Line Chart — `multi-line-chart-plugin.directive.js`](#63-multi-line-chart--multi-line-chart-plugindirectivejs)
   - 6.4 [Table Data — `table-data.directive.js`](#64-table-data--table-datadirectivejs)
   - 6.5 [Key-Value List — `key-value-list.directive.js`](#65-key-value-list--key-value-listdirectivejs)
   - 6.6 [Progress Bar — `progress-bar-plugin.directive.js`](#66-progress-bar--progress-bar-plugindirectivejs)
   - 6.7 [Loader (Spinner) — `loader.directive.js`](#67-loader-spinner--loaderdirectivejs)
   - 6.8 [Top Bar — `topbar.directive.js`](#68-top-bar--topbardirectivejs)
7. [System Monitor Plugins](#7-system-monitor-plugins)
   - 7.1 [Simple Table/Key-Value Plugins](#71-simple-tablekey-value-plugins)
   - 7.2 [Chart Plugins](#72-chart-plugins)
8. [Plugin Modules Reference](#8-plugin-modules-reference)
9. [Demo Mode](#9-demo-mode)
10. [Design System (Neumorphism Industrial Theme)](#10-design-system-neumorphism-industrial-theme)
11. [How to Run](#11-how-to-run)
12. [How to Add a New Plugin](#12-how-to-add-a-new-plugin)
13. [End-to-End Data Flow Example](#13-end-to-end-data-flow-example)

---

## 1. What is Linux Dash?

Linux Dash is a **self-contained web dashboard** that shows real-time information about your Linux server. No database, no complicated setup — just start the server and open a browser.

**What it monitors:**
- CPU usage, temperature, and load averages (with live charts)
- RAM usage (with live charts)
- Disk space (with per-partition progress bars)
- Network transfer rates and bandwidth (with live charts)
- Running processes sorted by CPU and memory
- Network connections, ARP cache, IP addresses
- User accounts and login history
- Installed applications (Redis, Memcached, PM2, etc.)
- Cron jobs and their history
- Docker container processes
- Ping speeds to configured hosts

---

## 2. How It Works (The Big Picture)

```
┌─────────────────────────────────────────────────────────┐
│                     YOUR BROWSER                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │           AngularJS Single Page App                │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │ Nav Bar │  │  Charts  │  │  Tables / Lists  │  │  │
│  │  └─────────┘  └──────────┘  └──────────────────┘  │  │
│  │         │             │               │            │  │
│  │         └─────────────┴───────────────┘            │  │
│  │                       │                            │  │
│  │              server.service.js                     │  │
│  │          (HTTP or WebSocket requests)              │  │
│  └───────────────────────┼────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
              GET /server/?module=cpu_utilization
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    PYTHON SERVER                          │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │              index.py (HTTP Server)                │  │
│  │         Forwards request to shell script           │  │
│  └───────────────────────┬────────────────────────────┘  │
│                          │                               │
│           subprocess.Popen("linux_json_api.sh cpu...")   │
│                          │                               │
│  ┌───────────────────────┴────────────────────────────┐  │
│  │       linux_json_api.sh (Bash Script)              │  │
│  │    Reads /proc/stat, /proc/meminfo, df, ps, etc.   │  │
│  │                 Returns JSON                        │  │
│  └───────────────────────┬────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
                    { "cpu": 25, ... }
                           │
┌──────────────────────────┼──────────────────────────────┐
│                     YOUR BROWSER                         │
│                   Chart updates!                         │
└─────────────────────────────────────────────────────────┘
```

**In plain English:**
1. The browser opens a web page served by Python (or Node.js/Go/PHP)
2. Every 1–1.5 seconds, the page sends a request: "give me CPU data"
3. The Python server runs a bash script with the matching function name
4. The bash script reads system files like `/proc/stat` and returns JSON
5. The browser receives the JSON and updates the chart/table

---

## 3. Project File Structure

```
linux-dash/
├── app/                          # Production build output
│   ├── index.html                # Production HTML entry point
│   ├── linuxDash.min.js          # Compiled + minified JavaScript
│   ├── linuxDash.min.css         # Compiled + minified CSS
│   └── server/                   # Server implementations
│       ├── index.py              # ★ Python HTTP server
│       ├── index.js              # Node.js HTTP + WebSocket server
│       ├── index.go              # Go HTTP server
│       ├── index.php             # PHP server
│       ├── linux_json_api.sh     # ★ Bash script: reads system data
│       └── config/               # Configuration files
│           └── ping_hosts        # Hosts to ping
│
├── src/                          # Source code (before compilation)
│   ├── css/                      # Global CSS files
│   │   ├── main.css              # Body, HTML base styles
│   │   ├── buttons.css           # Button styles
│   │   ├── tables.css            # Table styles
│   │   └── plugins-cotnainer.css # Plugin grid layout
│   └── js/
│       ├── core/                 # AngularJS core
│       │   ├── app.js            # Module definition + startup
│       │   ├── routes.js         # Tab routing definitions
│       │   ├── server.service.js # ★ Data fetching service
│       │   ├── features/         # Reusable UI components
│       │   │   ├── navbar/       # Top navigation bar
│       │   │   ├── plugin/       # Plugin card wrapper
│       │   │   ├── top-bar/      # Plugin header bar
│       │   │   ├── line-chart/   # Single-line chart
│       │   │   ├── multi-line-chart/  # Multi-line chart
│       │   │   ├── table-data/   # Sortable table
│       │   │   ├── key-value-list/    # Key-value display
│       │   │   ├── progress-bar/ # Progress bar
│       │   │   └── loader/       # Loading spinner
│       │   └── rootscope-event-handlers/
│       │       ├── make-plugins-draggable.run.js  # Drag and drop
│       │       └── hide-plugin.run.js             # Show/hide state
│       └── plugins/              # System monitor plugins
│           ├── simple-table-data-plugins.directive.js  # 23 table plugins
│           ├── ram-chart.directive.js
│           ├── cpu-utilization-chart.directive.js
│           ├── cpu-temp.directive.js
│           ├── cpu-avg-load-chart.directive.js
│           ├── download-transfer-rate-chart.directive.js
│           ├── upload-transfer-rate-chart.directive.js
│           └── disk-space/
│               ├── disk-space.directive.js
│               └── disk-space.html
│
├── index.html                    # Demo HTML entry point
├── demo.js                       # Mock data for demo mode
├── gulpfile.js                   # Build pipeline (Gulp)
├── package.json                  # Node.js dependencies
├── SKILL.md                      # Design system (Neumorphism)
└── DOCS.md                       # This documentation file
```

---

## 4. The Server Layer (Backend)

### 4.1 The Shell API Script — `linux_json_api.sh`

**File:** `app/server/linux_json_api.sh`  
**Lines:** 657  
**Language:** Bash

This is the **real workhorse** of Linux Dash. It's a single bash script containing 30+ functions. Each function reads data from Linux system files and returns it as JSON.

**How it works:**
1. The script is called with one argument — a module name (e.g., `cpu_utilization`)
2. It checks if a function with that name exists using `type -t`
3. If found, it calls the function, which reads system files and outputs JSON to stdout
4. The server captures this stdout and sends it to the browser

**Example — `cpu_utilization` function:**
```bash
cpu_utilization() {
  # Reads /proc/stat twice, 1 second apart
  # Calculates CPU usage from the difference
  # Returns a single number like: 25
}
```

**Example — `current_ram` function:**
```bash
current_ram() {
  # Reads /proc/meminfo
  # Calculates total, used, and available RAM in MB
  # Returns JSON: { "total": 512, "used": 200, "available": 312 }
}
```

**Example — `general_info` function:**
```bash
general_info() {
  # Runs: lsb_release -d, uname -r, hostname, uptime -p
  # Returns JSON: { "OS": "Ubuntu 20.04", "Hostname": "myserver", ... }
}
```

**Complete list of functions (modules):**
| Function | What It Reads | Returns |
|----------|--------------|---------|
| `cpu_utilization` | `/proc/stat` (twice) | CPU usage % (number) |
| `current_ram` | `/proc/meminfo` | `{total, used, available}` in MB |
| `load_avg` | `/proc/loadavg` | `{1_min_avg, 5_min_avg, 15_min_avg}` |
| `cpu_temp` | `/sys/class/thermal/thermal_zone*/temp` | Array of temperature readings |
| `disk_partitions` | `df -Ph` | Array of partition objects |
| `swap` | `/proc/swaps` | Array of swap objects |
| `general_info` | `lsb_release`, `uname`, `hostname`, `uptime` | `{OS, Hostname, Uptime, Server Time}` |
| `memory_info` | `/proc/meminfo` | Full key-value object |
| `cpu_info` | `lscpu` | Full key-value object |
| `ip_addresses` | `hostname -I`, `curl` for external IP | Array of `{interface, ip}` |
| `network_connections` | `ss -tun` or `netstat` | Array of `{connections, address}` |
| `arp_cache` | `arp -n` | Array of `{addr, hw_type, hw_addr}` |
| `bandwidth` | `/proc/net/dev` | Array of `{interface, tx, rx}` |
| `download_transfer_rate` | `/sys/class/net/*/statistics/rx_bytes` | `{interface: bytes_per_sec}` |
| `upload_transfer_rate` | `/sys/class/net/*/statistics/tx_bytes` | `{interface: bytes_per_sec}` |
| `ping` | `ping` (config hosts) | Array of `{host, ping}` |
| `ram_intensive_processes` | `ps aux --sort -rss` | Array of process objects |
| `cpu_intensive_processes` | `ps aux --sort -%cpu` | Array of process objects |
| `user_accounts` | `/etc/passwd` | Array of `{type, user, home}` |
| `logged_in_users` | `who` | Array of `{user, from, when}` |
| `recent_account_logins` | `last` | Array of login objects |
| `scheduled_crons` | `/etc/crontab`, `/var/spool/cron` | Array of cron objects |
| `cron_history` | `/var/log/syslog` (grep CRON) | Array of cron log objects |
| `common_applications` | `whereis` for 13 programs | Array of `{binary, location, installed}` |
| `docker_processes` | `docker stats --no-stream` | Array of container stats |
| `io_stats` | `/proc/diskstats` | Array of `{device, reads, writes, ...}` |
| `memcached` | `memcached` stats | Key-value stats object |
| `redis` | `redis-cli INFO` | Key-value stats object |
| `pm2_stats` | `pm2 jlist` | Array of PM2 process objects |

---

### 4.2 The Python Server — `index.py`

**File:** `app/server/index.py`  
**Lines:** 53  
**Python version:** 3.x

A simple threaded HTTP server built entirely with Python's standard library — no pip installs needed.

**How it works:**

```python
class MainHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/server/"):
            # It's a data request like: /server/?module=cpu_utilization
            module = self.path.split('=')[1]
            # Run the bash script with the module name
            output = subprocess.Popen(
                appRootPath + "/server/linux_json_api.sh " + module,
                shell=True, stdout=subprocess.PIPE
            )
            data = output.communicate()[0]  # Get the JSON output
        else:
            # It's a file request (HTML, CSS, JS)
            f = open(appRootPath + "/" + self.path, 'rb')
            data = f.read()
        # Send back to browser
        self.send_response(200)
        self.end_headers()
        self.wfile.write(data)
```

**Key features:**
- **Threaded** — Uses `ThreadingMixIn` so multiple people can view the dashboard at once
- **Port configurable** — Default port 80, override with `--port 8888`
- **Binds to all interfaces** — Listens on `0.0.0.0` so you can access it from other machines

**How to start:**
```bash
python3 app/server/index.py --port 8888
```

---

### 4.3 The Node.js Server — `index.js`

**File:** `app/server/index.js`  
**Lines:** 77

The Node.js server is the **recommended** server. It has one big advantage over the Python server: **WebSocket support**.

**What WebSockets add:**
- Instead of making a new HTTP request every second for each chart, the browser opens one persistent WebSocket connection
- The browser sends the module name over WebSocket, and the server pushes the response back
- This is more efficient for real-time updates (fewer connections, less overhead)

**How it detects WebSocket support:**
1. Browser loads the page, calls `GET /websocket` to check if the server supports it
2. If the response is `{ websocket_support: true }`, it opens a WebSocket connection
3. If WebSockets aren't supported (e.g., Python server), it falls back to HTTP requests

**How to start:**
```bash
npm install --production
node app/server/index.js
```

---

### 4.4 Other Servers (Go, PHP)

- **Go** (`index.go`): Similar to Python/Node.js. Run with `go run index.go`
- **PHP** (`index.php`): Point your web server (Apache/nginx) to the `app/` directory

---

## 5. The Frontend (AngularJS)

Linux Dash uses **AngularJS 1.3** — an older but battle-tested JavaScript framework. It's a Single Page Application (SPA) — the page never reloads, it just swaps content in and out.

### 5.1 App Boot Sequence

**File:** `src/js/core/app.js`  
**Lines:** 19

When the page loads:

```
1. Angular module 'linuxDash' starts
2. run() block executes:
   a. server.checkIfWebsocketsAreSupported()  — test WebSocket availability
   b. Register listener to save current tab to localStorage
   c. Navigate to /loading (shows spinner)
3. After WebSocket check (or timeout), event 'start-linux-dash' fires
4. Loading controller hears the event, navigates to last tab or /system-status
```

### 5.2 Tab Routing — `routes.js`

**File:** `src/js/core/routes.js`  
**Lines:** 82

Linux Dash has **5 tabs**, each is a route:

| Route | Tab Name | What It Shows |
|-------|----------|---------------|
| `/system-status` | System Status | RAM chart, CPU charts, processes, disk space, swap, Docker |
| `/basic-info` | Basic Info | Machine info, memory info, CPU info, cron jobs, IO stats |
| `/network` | Network | Upload/download charts, IPs, connections, ARP, ping, bandwidth |
| `/accounts` | Accounts | Server accounts, logged-in users, recent logins |
| `/apps` | Applications | Common apps, Memcached, Redis, PM2 |

Each route's template is a list of custom HTML elements (Angular directives):
```html
<ram-chart sortablejs-id="ram-chart"></ram-chart>
<cpu-avg-load-chart sortablejs-id="cpu-avg-load-chart"></cpu-avg-load-chart>
...
```

The `sortablejs-id` attribute enables drag-and-drop reordering.

**The loading screen** (`/loading`) is shown while the WebSocket connection (or HTTP fallback) is being established.

### 5.3 Data Fetching — `server.service.js`

**File:** `src/js/core/server.service.js`  
**Lines:** 144

This is the central service that **every plugin** uses to get data. It has a dual-transport strategy:

**WebSocket path (preferred):**
```
Browser opens WebSocket → sends "cpu_utilization" string →
Server runs bash script → sends back { moduleName: "cpu_utilization", output: "25" } →
Browser routes to correct callback
```

**HTTP fallback path:**
```
Browser → GET /server/?module=cpu_utilization →
Python server runs bash script → returns "25" →
Browser callback receives data
```

**How plugins call it:**
```javascript
server.get('cpu_utilization', function(data) {
    // data = 25 (or whatever the bash script returned)
    // Update the chart/table with this data
});
```

**Boot flow:**
1. `checkIfWebsocketsAreSupported()` checks browser support, then pings `GET /websocket`
2. If both browser and server support WS → opens WebSocket connection → fires `start-linux-dash`
3. If WS not supported (Python server) → fires `start-linux-dash` immediately

The `start-linux-dash` event is what kicks the app out of the loading screen.

### 5.4 Navigation Bar — `navbar.directive.js`

**File:** `src/js/core/features/navbar/navbar.directive.js`  
**Lines:** 37

Renders the top navigation with 5 tabs. Highlights the current tab by checking `$location.path()`. Also shows external links to GitHub, Gitter chat, and documentation.

---

## 6. Core UI Components (Plugins)

All plugins share a common architecture — they're wrapped in a `<plugin>` card, have a top bar with controls, and render data using one of the display components below.

### 6.1 Plugin Wrapper — `plugin.directive.js`

**File:** `src/js/core/features/plugin/plugin.directive.js`  
**Lines:** 41

Every plugin is wrapped in this component. It provides:

- **Top bar** — heading text, minimize button, width toggle, refresh button
- **Show/hide** — Minimize a plugin; state is saved to localStorage
- **Width toggle** — Expand a plugin to double width
- **Auto-hide** — If a plugin gets no data back, it auto-hides
- **Drag handle** — The heading text is the drag handle for reordering

**States:**
- `isHidden` — plugin is minimized (body hidden)
- `enlarged` — plugin is double-width
- `isChartPlugin` — special styling for chart plugins (no padding, no resize)

### 6.2 Line Chart — `line-chart-plugin.directive.js`

**File:** `src/js/core/features/line-chart/line-chart-plugin.directive.js`  
**Lines:** 158

Displays a **single-line real-time scrolling chart** using **SmoothieCharts** library.

**Inputs:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `heading` | String | Plugin title |
| `moduleName` | String | Which bash script function to call |
| `refreshRate` | Number | How often to fetch data (milliseconds) |
| `maxValue` | Number | Maximum Y-axis value (e.g., total RAM) |
| `minValue` | Number | Minimum Y-axis value (usually 0) |
| `getDisplayValue` | Function | Extract the number from server response |
| `metrics` | Array | Stats to show below the chart |
| `color` | String | Chart line color in RGB format |

**How it works:**
1. Waits for `maxValue` to be set (so the Y-axis scale is known)
2. Finds the `<canvas>` element
3. Creates a `SmoothieChart` with the given scale
4. Starts a polling loop: every `refreshRate` ms, fetches data and appends to the chart
5. Changes chart color based on usage: green → yellow → orange/red
6. Destroys the interval when the directive is destroyed

**Color thresholds:**
- Below 33% of max → green (default)
- 33% – 75% → yellow
- Above 75% → orange/red

### 6.3 Multi-Line Chart — `multi-line-chart-plugin.directive.js`

**File:** `src/js/core/features/multi-line-chart/multi-line-chart-plugin.directive.js`  
**Lines:** 167

Like the line chart, but supports **multiple data series** on the same chart. Used for:

- **CPU Load Average** — 1-min, 5-min, and 15-min averages as separate lines
- **Upload Transfer Rate** — One line per network interface
- **Download Transfer Rate** — One line per network interface

**How it discovers lines:**
1. On initialization, fetches data once to see what keys exist
2. Creates one `TimeSeries` per key, each with a different color
3. Colors cycle through: red, green, blue, yellow

**Auto-scaling:**
The Y-axis maximum auto-adjusts by rounding up to the nearest power of 10. If the highest data point is 432, the max becomes 1000.

### 6.4 Table Data — `table-data.directive.js`

**File:** `src/js/core/features/table-data/table-data.directive.js`  
**Lines:** 79

Displays server data as a **sortable, searchable HTML table**.

**Features:**
- **Column auto-detection** — Reads the keys from the first row of data
- **Sorting** — Click any column header to sort ascending; click again for descending
- **Search/Filter** — Type in the search box to filter rows
- **Empty state** — Shows "No data" if the response is empty

**How it works:**
1. Fetches data once via `server.get(moduleName)`
2. Extracts column headers from `Object.keys(data[0])`
3. Renders as a table with `ng-repeat` for rows and columns
4. Clicking a header sets `sortByColumn` and sorts in-place

### 6.5 Key-Value List — `key-value-list.directive.js`

**File:** `src/js/core/features/key-value-list/key-value-list.directive.js`  
**Lines:** 29

Displays server data as a **key-value list**. Used for objects like `memory_info` and `cpu_info` where the data is a flat object (not an array).

```
┌─────────────────────────────────────┐
│ Key            │ Value              │
├─────────────────────────────────────┤
│ MemTotal       │ 10120412 kB        │
│ MemFree        │ 7257156 kB         │
│ MemAvailable   │ 8173888 kB         │
│ Buffers        │ 257824 kB          │
│ Cached         │ 1175940 kB         │
│ ...            │ ...                │
└─────────────────────────────────────┘
```

### 6.6 Progress Bar — `progress-bar-plugin.directive.js`

**File:** `src/js/core/features/progress-bar/progress-bar-plugin.directive.js`  
**Lines:** 18

A horizontal progress bar. Used by the **disk space** plugin to show per-partition fill levels.

```
┌──────────────────────────────────────┐
│ /dev/sda1  [████████████░░░░░░░] 50% │
│ tmpfs      [█░░░░░░░░░░░░░░░░░]  1% │
└──────────────────────────────────────┘
```

### 6.7 Loader (Spinner) — `loader.directive.js`

**File:** `src/js/core/features/loader/loader.directive.js`  
**Lines:** 16

A CSS-animated 5-bar spinner shown while data is loading. Uses `@keyframes` to animate vertical scaling.

### 6.8 Top Bar — `topbar.directive.js`

**File:** `src/js/core/features/top-bar/topbar.directive.js`  
**Lines:** 28

The header bar on each plugin card. Contains:
- Draggable handle (`☰`)
- Heading text
- Minimize button (`−`)
- Width toggle button (`↔`, non-chart plugins only)
- Refresh button (`↺`, non-chart plugins only, hidden when minimized)

---

## 7. System Monitor Plugins

### 7.1 Simple Table/Key-Value Plugins

**File:** `src/js/plugins/simple-table-data-plugins.directive.js`  
**Lines:** 110

This is a **plugin factory**. Instead of writing a separate file for each table or key-value plugin, it generates 23 directives from a configuration array.

**How it works:**
```javascript
var simpleTableModules = [
  {
    name: 'ipAddresses',          // becomes <ip-addresses> directive
    template: '<table-data heading="IP Addresses" module-name="ip_addresses"></table-data>'
  },
  {
    name: 'machineInfo',          // becomes <machine-info> directive
    template: '<key-value-list heading="General Info." module-name="general_info"></key-value-list>'
  },
  // ... 21 more entries
]

// Loop through and register each as an Angular directive
simpleTableModules.forEach(function(module) {
  angular.module('linuxDash').directive(module.name, function() {
    return {
      restrict: 'E',       // element-only (e.g., <ip-addresses>)
      scope: {},           // isolated scope
      template: module.template
    }
  })
})
```

**Generated directives:**
| Directive | Display Type | Module Name |
|-----------|-------------|-------------|
| `<machine-info>` | Key-Value List | `general_info` |
| `<ip-addresses>` | Table | `ip_addresses` |
| `<ram-intensive-processes>` | Table | `ram_intensive_processes` |
| `<cpu-intensive-processes>` | Table | `cpu_intensive_processes` |
| `<docker-processes>` | Table | `docker_processes` |
| `<network-connections>` | Table | `network_connections` |
| `<server-accounts>` | Table | `user_accounts` |
| `<logged-in-accounts>` | Table | `logged_in_users` |
| `<recent-logins>` | Table | `recent_account_logins` |
| `<arp-cache-table>` | Table | `arp_cache` |
| `<common-applications>` | Table | `common_applications` |
| `<ping-speeds>` | Table | `ping` |
| `<bandwidth>` | Table | `bandwidth` |
| `<swap-usage>` | Table | `swap` |
| `<internet-speed>` | Key-Value List | `internet_speed` |
| `<memcached>` | Key-Value List | `memcached` |
| `<redis>` | Key-Value List | `redis` |
| `<pm2>` | Table | `pm2_stats` |
| `<memory-info>` | Key-Value List | `memory_info` |
| `<cpu-info>` | Key-Value List | `cpu_info` |
| `<io-stats>` | Table | `io_stats` |
| `<scheduled-crons>` | Table | `scheduled_crons` |
| `<cron-history>` | Table | `cron_history` |

### 7.2 Chart Plugins

Each chart plugin wraps one of the two core chart components.

| File | Directive | Chart Type | Module | Refresh | Purpose |
|------|-----------|-----------|--------|---------|---------|
| `ram-chart.directive.js` | `<ram-chart>` | Line | `current_ram` | 1000ms | RAM usage over time |
| `cpu-utilization-chart.directive.js` | `<cpu-utilization-chart>` | Line | `cpu_utilization` | 1500ms | CPU usage % over time |
| `cpu-temp.directive.js` | `<cpu-temp>` | Line | `cpu_temp` | 1500ms | CPU temperature over time |
| `cpu-avg-load-chart.directive.js` | `<cpu-avg-load-chart>` | Multi-Line | `load_avg` | 1000ms | Load averages (1/5/15 min) |
| `download-transfer-rate-chart.directive.js` | `<download-transfer-rate-chart>` | Multi-Line | `download_transfer_rate` | 1000ms | Download rate per interface |
| `upload-transfer-rate-chart.directive.js` | `<upload-transfer-rate-chart>` | Multi-Line | `upload_transfer_rate` | 1000ms | Upload rate per interface |
| `disk-space/disk-space.directive.js` | `<disk-space>` | Progress Bars | `disk_partitions` | Manual | Disk usage per partition |

**Example: RAM Chart (`ram-chart.directive.js`)**

This shows how chart plugins work:

```javascript
// 1. Define the directive
angular.module('linuxDash').directive('ramChart', function(server) {
  return {
    scope: {},
    template: '<line-chart-plugin heading="RAM Usage" module-name="current_ram" ...>',
    link: function(scope) {
      // 2. Pre-fetch to get maxRam (total RAM)
      server.get('current_ram', function(data) {
        scope.maxRam = data.total    // e.g., 512 MB
      })
      // 3. Extract the used value from response
      scope.ramToDisplay = function(serverResponseData) {
        return serverResponseData.used
      }
      // 4. Generate human-readable metrics
      scope.ramMetrics = [{
        name: 'Used',
        generate: function(data) {
          return data.used + ' MB (' + Math.round(data.used/data.total*100) + '%)'
        }
      }, {
        name: 'Available',
        generate: function(data) {
          return data.available + ' MB of ' + data.total + ' MB'
        }
      }]
    }
  }
})
```

---

## 8. Plugin Modules Reference

This table maps every route tab to its plugins and the bash script functions they call:

### System Status (`/system-status`)
| Plugin | Module Name | Display | Auto-Refresh? |
|--------|-------------|---------|---------------|
| RAM Chart | `current_ram` | Line chart | Yes (1s) |
| CPU Avg Load | `load_avg` | Multi-line chart | Yes (1s) |
| CPU Utilization | `cpu_utilization` | Line chart | Yes (1.5s) |
| CPU Temp | `cpu_temp` | Line chart | Yes (1.5s) |
| RAM Processes | `ram_intensive_processes` | Table | No (manual) |
| CPU Processes | `cpu_intensive_processes` | Table | No (manual) |
| Disk Space | `disk_partitions` | Progress bars | No (manual) |
| Swap Usage | `swap` | Table | No (manual) |
| Docker Processes | `docker_processes` | Table | No (manual) |

### Basic Info (`/basic-info`)
| Plugin | Module Name | Display |
|--------|-------------|---------|
| Machine Info | `general_info` | Key-value list |
| Memory Info | `memory_info` | Key-value list |
| CPU Info | `cpu_info` | Key-value list |
| Scheduled Crons | `scheduled_crons` | Table |
| Cron History | `cron_history` | Table |
| IO Stats | `io_stats` | Table |

### Network (`/network`)
| Plugin | Module Name | Display | Auto-Refresh? |
|--------|-------------|---------|---------------|
| Upload Rate | `upload_transfer_rate` | Multi-line chart | Yes (1s) |
| Download Rate | `download_transfer_rate` | Multi-line chart | Yes (1s) |
| IP Addresses | `ip_addresses` | Table | No |
| Network Connections | `network_connections` | Table | No |
| ARP Cache | `arp_cache` | Table | No |
| Ping Speeds | `ping` | Table | No |
| Bandwidth | `bandwidth` | Table | No |

### Accounts (`/accounts`)
| Plugin | Module Name | Display |
|--------|-------------|---------|
| Server Accounts | `user_accounts` | Table |
| Logged-in Accounts | `logged_in_users` | Table |
| Recent Logins | `recent_account_logins` | Table |

### Apps (`/apps`)
| Plugin | Module Name | Display |
|--------|-------------|---------|
| Common Applications | `common_applications` | Table |
| Memcached | `memcached` | Key-value list |
| Redis | `redis` | Key-value list |
| PM2 | `pm2_stats` | Table |

---

## 9. Demo Mode

**Files:** `index.html` + `demo.js`  
**Lines:** 133

The demo mode lets you see the dashboard **without a real Linux server** — all data is mocked.

**How it works:**
1. `index.html` loads a different Angular module: `linuxDashDemo` (instead of `linuxDash`)
2. `demo.js` registers `linuxDashDemo` which depends on `linuxDash` + `ngMockE2E`
3. `ngMockE2E` intercepts **all HTTP requests** and returns hardcoded data
4. Everything looks and feels real, but no actual system data is read

**How to use demo mode:**
```bash
# Open index.html directly in a browser
# OR serve statically:
python3 -m http.server 8080
# Then open http://localhost:8080/index.html
```

**Key demo behavior:**
- WebSocket support is set to `false` (forces HTTP mode)
- All `/server/?module=X` requests return realistic fake data
- RAM shows 200MB used out of 512MB total
- CPU shows steady 25% utilization
- Network shows sample rates and connections
- All tables show realistic-looking entries

---

## 10. Design System (Neumorphism Industrial Theme)

**File:** `SKILL.md`  
**Style:** Neumorphism (soft extruded UI) + Industrial Dark

**Design tokens:**
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#1a1d23` | Page body |
| Surface | `#21242b` | Plugin cards, navbar |
| Primary accent | `#00b894` | Nav tabs, table headers, highlights |
| Text | `#c8ccd4` | Body text |
| Text dimmed | `#6b7080` / `#888d98` | Secondary text |
| Danger | `#FF2157` | (reserved) |
| Warning | `#FE9900` | (reserved) |
| Success | `#00A63D` | (reserved) |
| Font primary | Space Mono | All text |
| Font mono | JetBrains Mono | Code/monospace |

**Shadow effects (neumorphism):**
```css
/* Raised card (extruded outward) */
box-shadow:
  8px 8px 16px rgba(0, 0, 0, 0.5),     /* dark shadow bottom-right */
  -4px -4px 8px rgba(255, 255, 255, 0.03); /* light shadow top-left */

/* Inset/pressed (recessed inward) */
box-shadow:
  inset 3px 3px 6px rgba(0, 0, 0, 0.6),
  inset -2px -2px 4px rgba(255, 255, 255, 0.02);
```

---

## 11. How to Run

### Python (simplest — no dependencies)
```bash
# Clone the repo
git clone https://github.com/HamburgersWithNoPickledCucumber/Linux_final.git
cd Linux_final

# Start the server (port 80 requires sudo, use --port to change)
python3 app/server/index.py --port 8888

# Open in browser
# http://localhost:8888
```

### Node.js (recommended — supports WebSockets)
```bash
cd app/server
npm install --production
node index.js

# http://localhost:80
```

### Demo mode (no real server needed)
```bash
# Open index.html directly in a browser
# OR
python3 -m http.server 8080
# Then open http://localhost:8080/index.html
```

### Build from source (if you modify CSS/JS)
```bash
npm install
npx gulp build
# Output: app/linuxDash.min.js and app/linuxDash.min.css
```

**Note:** Gulp 3 is incompatible with Node.js v12+. On newer Node, build the CSS manually:
```bash
# The CSS is already pre-built in app/linuxDash.min.css
# If you modify source CSS, rebuild with:
python3 -c "
import os, re
# (concatenates all src/**/*.css and writes to app/linuxDash.min.css)
"
```

---

## 12. How to Add a New Plugin

You want to add a new monitoring widget? Follow these steps:

### Step 1: Add a bash function to `linux_json_api.sh`

```bash
# In app/server/linux_json_api.sh, add a new function:
my_new_metric() {
  # Read whatever data you want
  # Output it as JSON to stdout
  echo '{"field1": "value1", "field2": 42}'
}
```

### Step 2a: If it's a TABLE or KEY-VALUE display

Add one line to `src/js/plugins/simple-table-data-plugins.directive.js`:

```javascript
var simpleTableModules = [
  // ... existing entries ...
  {
    name: 'myNewMetric',           // becomes <my-new-metric> directive
    template: '<table-data heading="My Metric" module-name="my_new_metric" info="Description of my metric"></table-data>'
    // OR for key-value:
    // template: '<key-value-list heading="My Metric" module-name="my_new_metric" info="Description"></key-value-list>'
  }
]
```

### Step 2b: If it's a LIVE CHART

Create a new file in `src/js/plugins/` following the existing chart pattern (see `ram-chart.directive.js` for a template).

### Step 3: Add to a route

In `src/js/core/routes.js`, add your new directive to the appropriate tab:

```javascript
.when('/system-status', {
  template: [
    '<ram-chart sortablejs-id="ram-chart"></ram-chart>',
    // ... existing plugins ...
    '<my-new-metric sortablejs-id="my-new-metric"></my-new-metric>',  // ADD THIS
  ].join(''),
})
```

### Step 4: Rebuild

```bash
npx gulp build
# Or manually rebuild CSS if needed
```

---

## 13. End-to-End Data Flow Example

Let's trace what happens when you view the **RAM Usage** chart:

```
1. You open http://localhost:8888
   ↓
2. Python server sends app/index.html
   ↓
3. Browser loads AngularJS, SmoothieCharts, and all plugins from linuxDash.min.js
   ↓
4. app.js runs: server.checkIfWebsocketsAreSupported()
   - Calls GET /websocket → Python server doesn't support WS
   - Fallback: fires "start-linux-dash" event immediately
   ↓
5. routes.js loading controller hears "start-linux-dash"
   - Navigates to /system-status (or last saved tab)
   ↓
6. Angular processes the template for /system-status:
   <ram-chart sortablejs-id="ram-chart"></ram-chart>
   ↓
7. ram-chart.directive.js link() runs:
   - Calls server.get('current_ram', callback) to find total RAM
   - server.js → GET /server/?module=current_ram
   ↓
8. Python server (index.py) handles GET /server/?module=current_ram:
   - Extracts "current_ram" from URL
   - Runs: subprocess.Popen("linux_json_api.sh current_ram")
   ↓
9. linux_json_api.sh executes current_ram() function:
   - Reads /proc/meminfo
   - Calculates total=512, used=200, available=312
   - Echoes: {"total": 512, "used": 200, "available": 312}
   ↓
10. Python server captures stdout, sends back to browser
    ↓
11. ram-chart callback receives {total: 512, used: 200, available: 312}
    - Sets scope.maxRam = 512
    ↓
12. line-chart-plugin.directive.js detects maxValue is now set
    - Creates SmoothieChart with maxValue=512, minValue=0
    - Starts $interval polling every 1000ms
    ↓
13. Every second:
    - server.get('current_ram', callback)
    - Python runs bash script, returns current usage
    - series.append(timestamp, currentUsage)
    - Chart scrolls, color changes based on usage level
    - Metrics text updates ("Used: 200 MB (40%)")
```

---

## Key Terms Glossary

| Term | Meaning |
|------|---------|
| **SPA** | Single Page Application — the page never reloads, content is swapped dynamically |
| **Directive** | An AngularJS custom HTML element (e.g., `<ram-chart>`) |
| **Module** | A bash script function that reads system data (e.g., `cpu_utilization`) |
| **Plugin** | A widget on the dashboard (wraps a module's data in a chart or table) |
| **WebSocket** | A persistent two-way connection between browser and server |
| **SmoothieCharts** | A JavaScript library for real-time scrolling line charts |
| **Neumorphism** | A UI style where elements appear to extrude from the background using soft shadows |
| **SortableJS** | A JavaScript library for drag-and-drop reordering |
| **ngMockE2E** | An AngularJS module that intercepts HTTP requests for testing/mocking |

---

*Documentation generated May 2026. For the latest version, see: https://github.com/HamburgersWithNoPickledCucumber/Linux_final*

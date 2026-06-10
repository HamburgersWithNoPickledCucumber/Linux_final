# React Frontend — Linux Board

## Overview

The Linux Board frontend has been migrated from **AngularJS 1.3.4** to a modern **React 19 SPA** using **Vite 8** as the build toolchain. The backend (bash script + Node.js/Python/Go/PHP servers) is untouched.

| | Before | After |
|---|---|---|
| **Framework** | AngularJS 1.3.4 | React 19 |
| **Bundler** | Gulp 3 | Vite 8 |
| **Routing** | angular-route (hash) | React Router v7 |
| **Charts** | SmoothieCharts (same) | SmoothieCharts (wrapped in React) |
| **Drag & Drop** | SortableJS | @dnd-kit |
| **Styling** | Global CSS | CSS Modules + CSS custom properties |
| **Design** | Neumorphic dark | Modern dark industrial |
| **Demo mode** | Yes | Removed |

---

## Project Structure

```
linux-dash/
├── app/                          # Original AngularJS build (unchanged)
├── app-react/                    # New React build output
│   ├── index.html
│   ├── smoothie.js
│   └── assets/
│       ├── index-*.js
│       └── index-*.css
├── frontend/                     # React source
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              # Entry point
│       ├── App.jsx               # Router + providers
│       ├── pages.jsx             # 5 tab page components
│       ├── context/
│       │   ├── DashboardContext.jsx   # Tab, hidden plugins, layout
│       │   └── ServerContext.jsx      # Data fetching + polling
│       ├── hooks/
│       │   └── useServerData.js       # Generic data hook
│       ├── services/
│       │   └── dataService.js         # HTTP + WebSocket transport
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   └── PluginGrid.jsx     # Drag-and-drop grid
│       │   ├── ui/
│       │   │   ├── PluginCard.jsx     # Card wrapper
│       │   │   ├── LineChart.jsx      # Smoothie single-line
│       │   │   ├── MultiLineChart.jsx # Smoothie multi-line
│       │   │   ├── DataTable.jsx      # Sortable/searchable table
│       │   │   ├── KeyValueList.jsx   # Key-value display
│       │   │   ├── ProgressBar.jsx    # Disk usage bars
│       │   │   └── Spinner.jsx        # Loading indicator
│       │   └── plugins/
│       │       ├── pluginConfig.js         # 22 simple plugin configs
│       │       ├── SimplePlugin.jsx         # Generic plugin renderer
│       │       ├── RamChart.jsx
│       │       ├── CpuAvgLoadChart.jsx
│       │       ├── CpuUtilizationChart.jsx
│       │       ├── CpuTemp.jsx
│       │       ├── DiskSpace.jsx
│       │       ├── DownloadTransferRateChart.jsx
│       │       └── UploadTransferRateChart.jsx
│       └── styles/
│           ├── variables.css     # CSS custom properties (theme)
│           └── global.css        # Reset + base styles
└── app/server/                   # Backend (unchanged)
```

---

## Architecture

### Data Flow

```
Browser (React)
    │
    ├── WebSocket (preferred)
    │   └── ws://host:port → Node.js server → linux_json_api.sh → JSON
    │
    └── HTTP GET (fallback)
        └── /server/?module=<name> → Server → linux_json_api.sh → JSON
```

### Component Hierarchy

```
<App>
  <DashboardProvider>        ← tab, hidden plugins, drag order (localStorage)
    <ServerProvider>         ← WebSocket init, data transport, polling
      <Navbar />             ← 5 tab links + external docs
      <Routes>
        /system-status → <PluginGrid> → <RamChart />, <CpuUtilizationChart />, ...
        /basic-info    → <PluginGrid> → <SimplePlugin /> × 6
        /network       → <PluginGrid> → <UploadChart />, <DownloadChart />, ...
        /accounts      → <PluginGrid> → <SimplePlugin /> × 3
        /apps          → <PluginGrid> → <SimplePlugin /> × 4
      </Routes>
    </ServerProvider>
  </DashboardProvider>
</App>
```

### Plugins (26 total)

**System Status** (9): RAM Usage, CPU Avg Load, CPU Utilization, CPU Temperature, RAM Processes, CPU Processes, Disk Partitions, Swap Usage, Docker Processes

**Basic Info** (6): General Info, Memory Info, CPU Info, Scheduled Crons, Cron History, IO Stats

**Network** (7): Upload Rate, Download Rate, IP Addresses, Network Connections, ARP Cache, Ping Speeds, Bandwidth

**Accounts** (3): Server Accounts, Logged In Users, Recent Logins

**Apps** (4): Common Applications, Memcached, Redis, PM2

---

## Theme

```css
--bg-primary:    #0f1117   (page background)
--bg-card:       #161820   (plugin cards)
--bg-input:      #1c1f2a   (input fields)
--border:        #252830   (card borders)
--text-primary:  #e1e4eb   (main text)
--text-secondary:#8b8fa3   (labels)
--accent:        #00b894   (brand green)
--danger:        #ff5757   (high usage red)
--warning:       #ffb142   (medium usage amber)
--font-mono:     'JetBrains Mono', 'Space Mono', monospace
--font-sans:     system-ui, sans-serif
```

---

## Commands

```bash
# Development (with HMR, proxy to backend on :2800)
cd linux-dash/frontend
npm run dev

# Production build (output to ../app-react/)
npm run build

# Preview production build
npm run preview
```

---

## Key Differences from AngularJS Version

| Feature | AngularJS 1.3 | React 19 |
|---|---|---|
| State management | `$rootScope` + `$scope` | React Context |
| Data binding | Two-way `$scope.$digest()` | One-way props + hooks |
| Dependency injection | Angular DI (`server` service) | Context + hooks |
| Plugin factory | `simpleTableModules.forEach()` + `$compile` | `pluginConfig.js` + `SimplePlugin` component |
| Template loading | `$templateCache` + `ng-include` | JSX + ES imports |
| Build | Gulp concat + ngAnnotate + uglify | Vite with Rollup |
| CSS | Global `main.css` | CSS Modules per component |
| Drag | SortableJS custom directive | `@dnd-kit/sortable` with `SortableContext` |

---

## Backward Compatibility

The backend **has not changed**. The React frontend queries the same endpoints:
- `GET /server/?module=<name>` — HTTP data
- `GET /websocket` — WebSocket capability check
- `ws://host:port` — WebSocket data channel

The new frontend can be served by the existing Node.js server by pointing Express to serve `app-react/` instead of `app/`.

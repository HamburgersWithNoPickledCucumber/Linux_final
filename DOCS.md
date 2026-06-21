# Linux Dash Architecture

## Request Flow

```text
React component
  -> useModuleData hook
  -> dashboardClient
  -> WebSocket or GET /server/?module=<name>
  -> Node/Python/Go/PHP server
  -> linux_json_api.sh <name>
  -> /proc, /sys, and Linux commands
  -> JSON response
```

The browser starts with HTTP requests while the WebSocket capability check is running. Once connected, later requests use WebSocket. A failed or timed-out WebSocket request falls back to HTTP.

## Frontend

### Configuration

[`src/dashboardConfig.js`](src/dashboardConfig.js) defines the five sections and every monitoring card. A card configuration selects one of four renderers:

- `line`: one real-time series and summary metrics
- `multi-line`: one series per object key
- `table`: searchable, sortable array data
- `key-value`: object data
- `disk`: partition table with usage bars

### State

[`src/App.jsx`](src/App.jsx) owns:

- Current section
- Theme
- Pause state
- Global refresh token
- Connection status
- Persistent card order

Theme, current section, hidden cards, and card order are stored in `localStorage`.

### Data Client

[`src/api/dashboardClient.js`](src/api/dashboardClient.js) maintains one WebSocket connection and queues requests by module name. It parses the server's nested JSON response and falls back to HTTP when WebSocket is unavailable.

[`src/hooks/useModuleData.js`](src/hooks/useModuleData.js) handles initial loading, polling, request deduplication, pause state, errors, and manual refresh.

### Charts

[`src/components/LiveChart.jsx`](src/components/LiveChart.jsx) uses the Canvas 2D API. It retains the latest 60 data points, redraws through `ResizeObserver`, and reads theme colors from CSS custom properties.

## Backend

The Node.js server serves `app/`, exposes `/websocket`, accepts WebSocket module requests, and exposes the HTTP fallback at `/server/`.

The shell script uses function dispatch:

```bash
./app/server/linux_json_api.sh current_ram
./app/server/linux_json_api.sh cpu_utilization
```

Each public function prints valid JSON. The frontend supports objects, arrays, and scalar values.

## Add A Monitoring Card

1. Add a Bash function to `app/server/linux_json_api.sh`.
2. Ensure the function prints valid JSON.
3. Add a configuration entry to the appropriate array in `src/dashboardConfig.js`.
4. Run `npm run build`.

Example table:

```js
{
  type: 'table',
  module: 'my_module',
  heading: 'My Module',
  info: 'Description shown as card help text.',
}
```

Example chart:

```js
{
  type: 'line',
  module: 'my_metric',
  heading: 'My Metric',
  interval: 1500,
  value: Number,
  max: () => 100,
  metrics: (data) => [['Value', `${data} %`]],
}
```

## Production

```bash
npm ci
npm run build
LINUX_DASH_SERVER_PORT=2800 npm run serve
```

The generated `app/index.html` references hashed files under `app/assets/`. Do not manually edit generated assets; change `src/` and rebuild.

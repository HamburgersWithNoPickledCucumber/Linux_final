let wsConnection = null;
const wsHandlers = {};

function getWebSocketUrl() {
  const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
  return protocol + window.location.hostname + ':' + window.location.port;
}

function connectWebSocket() {
  if (wsConnection) return;

  const url = getWebSocketUrl();
  wsConnection = new WebSocket(url);

  wsConnection.onopen = () => {
    console.info('WebSocket connection open');
  };

  wsConnection.onmessage = (event) => {
    try {
      const response = JSON.parse(event.data);
      const moduleName = response.moduleName;
      const moduleData = JSON.parse(response.output);
      if (wsHandlers[moduleName]) {
        wsHandlers[moduleName](moduleData);
      }
    } catch (e) {
      console.warn('WebSocket message parse error:', e);
    }
  };

  wsConnection.onclose = () => {
    wsConnection = null;
    setTimeout(connectWebSocket, 3000);
  };

  wsConnection.onerror = () => {
    wsConnection = null;
  };
}

export async function checkWebSocketSupport() {
  if (!window.WebSocket) return false;

  try {
    const resp = await fetch('/websocket', { cache: 'no-cache' });
    const data = await resp.json();
    return !!data.websocket_support;
  } catch {
    return false;
  }
}

export function useWebSocket(moduleName, callback) {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsHandlers[moduleName] = callback;
    wsConnection.send(moduleName);
    return true;
  }
  return false;
}

export function hasWebSocket() {
  return wsConnection !== null && wsConnection.readyState === WebSocket.OPEN;
}

export async function fetchModule(moduleName) {
  const resp = await fetch(`server/?module=${moduleName}`, { cache: 'no-cache' });
  return resp.json();
}

export function cleanupWebSocket() {
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}

export function initWebSocket() {
  checkWebSocketSupport().then((supported) => {
    if (supported) connectWebSocket();
  });
}

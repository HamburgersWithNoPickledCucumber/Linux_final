class DashboardClient {
  constructor() {
    this.socket = null
    this.pending = new Map()
    this.connectionListeners = new Set()
    this.connectionState = 'connecting'
    this.connect()
  }

  subscribe(listener) {
    this.connectionListeners.add(listener)
    listener(this.connectionState)
    return () => this.connectionListeners.delete(listener)
  }

  setConnectionState(state) {
    this.connectionState = state
    this.connectionListeners.forEach((listener) => listener(state))
  }

  async connect() {
    if (!window.WebSocket) {
      this.setConnectionState('http')
      return
    }

    try {
      const response = await fetch('/websocket', { cache: 'no-store' })
      const support = await response.json()
      if (!support.websocket_support) throw new Error('WebSocket is not supported by the server')

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const developmentHost = `${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || '2800'}`
      const websocketHost = import.meta.env.DEV ? developmentHost : window.location.host
      const socket = new WebSocket(`${protocol}//${websocketHost}`)
      this.socket = socket

      socket.addEventListener('open', () => this.setConnectionState('websocket'))
      socket.addEventListener('message', (event) => this.handleMessage(event))
      socket.addEventListener('error', () => this.setConnectionState('http'))
      socket.addEventListener('close', () => {
        this.socket = null
        this.rejectPending(new Error('WebSocket connection closed'))
        this.setConnectionState('http')
      })
    } catch {
      this.setConnectionState('http')
    }
  }

  handleMessage(event) {
    try {
      const response = JSON.parse(event.data)
      const queue = this.pending.get(response.moduleName)
      const request = queue?.shift()
      if (!request) return
      clearTimeout(request.timer)
      request.resolve(JSON.parse(response.output))
      if (!queue.length) this.pending.delete(response.moduleName)
    } catch (error) {
      console.error('Unable to parse dashboard response', error)
    }
  }

  rejectPending(error) {
    this.pending.forEach((queue) => {
      queue.forEach((request) => {
        clearTimeout(request.timer)
        request.reject(error)
      })
    })
    this.pending.clear()
  }

  async get(moduleName) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        return await this.getFromWebSocket(moduleName)
      } catch {
        return this.getFromHttp(moduleName)
      }
    }
    return this.getFromHttp(moduleName)
  }

  getFromWebSocket(moduleName) {
    return new Promise((resolve, reject) => {
      const queue = this.pending.get(moduleName) || []
      const request = {
        resolve,
        reject,
        timer: window.setTimeout(() => {
          const currentQueue = this.pending.get(moduleName) || []
          this.pending.set(
            moduleName,
            currentQueue.filter((item) => item !== request),
          )
          reject(new Error(`Timed out loading ${moduleName}`))
        }, 12000),
      }

      queue.push(request)
      this.pending.set(moduleName, queue)
      this.socket.send(moduleName)
    })
  }

  async getFromHttp(moduleName) {
    const response = await fetch(`/server/?module=${encodeURIComponent(moduleName)}`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
    return response.json()
  }
}

export const dashboardClient = new DashboardClient()

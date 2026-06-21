import { useCallback, useEffect, useRef, useState } from 'react'
import { dashboardClient } from '../api/dashboardClient'
import { publishModuleData } from '../state/moduleStore'

export function useModuleData(moduleName, options = {}) {
  const { interval = 0, paused = false, refreshToken = 0 } = options
  const [state, setState] = useState({ data: null, error: null, loading: true, updatedAt: null })
  const inFlight = useRef(false)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    if (inFlight.current || paused) return
    inFlight.current = true
    setState((current) => ({ ...current, error: null, loading: current.data === null }))

    try {
      const data = await dashboardClient.get(moduleName)
      if (mounted.current) {
        const updatedAt = Date.now()
        setState({ data, error: null, loading: false, updatedAt })
        publishModuleData(moduleName, data, updatedAt)
      }
    } catch (error) {
      if (mounted.current) {
        setState((current) => ({ ...current, error: error.message, loading: false }))
      }
    } finally {
      inFlight.current = false
    }
  }, [moduleName, paused])

  useEffect(() => {
    mounted.current = true
    refresh()
    if (!interval || paused) return () => { mounted.current = false }

    const timer = window.setInterval(refresh, interval)
    return () => {
      mounted.current = false
      window.clearInterval(timer)
    }
  }, [interval, paused, refresh])

  useEffect(() => {
    if (refreshToken > 0) refresh()
  }, [refresh, refreshToken])

  return { ...state, refresh }
}

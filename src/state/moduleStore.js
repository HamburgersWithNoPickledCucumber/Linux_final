import { useSyncExternalStore } from 'react'

const snapshots = new Map()
const listeners = new Set()

export function publishModuleData(moduleName, data, updatedAt) {
  snapshots.set(moduleName, { data, updatedAt })
  listeners.forEach((listener) => listener())
}

export function useModuleSnapshot(moduleName) {
  return useSyncExternalStore(
    subscribe,
    () => snapshots.get(moduleName) || EMPTY_SNAPSHOT,
    () => EMPTY_SNAPSHOT,
  )
}

export function useLatestModuleUpdate() {
  return useSyncExternalStore(subscribe, getLatestUpdate, () => null)
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getLatestUpdate() {
  let latest = null
  snapshots.forEach((snapshot) => {
    if (snapshot.updatedAt && (!latest || snapshot.updatedAt > latest)) {
      latest = snapshot.updatedAt
    }
  })
  return latest
}

const EMPTY_SNAPSHOT = Object.freeze({ data: null, updatedAt: null })

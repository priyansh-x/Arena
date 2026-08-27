import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { API_BASE } from '../api/client'

let shared = null
function getSocket() {
  if (!shared) shared = io(API_BASE, { transports: ['websocket', 'polling'] })
  return shared
}

// subscribe to one or more socket events; handlers is { event: fn }
export function useSocket(handlers, deps = []) {
  const ref = useRef(handlers)
  ref.current = handlers
  useEffect(() => {
    const socket = getSocket()
    const entries = Object.keys(ref.current || {})
    const wrapped = {}
    for (const ev of entries) {
      wrapped[ev] = (payload) => ref.current[ev]?.(payload)
      socket.on(ev, wrapped[ev])
    }
    return () => {
      for (const ev of entries) socket.off(ev, wrapped[ev])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return getSocket()
}

export { getSocket }

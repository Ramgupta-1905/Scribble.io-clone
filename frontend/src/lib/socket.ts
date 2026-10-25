
import { io } from 'socket.io-client'

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  'https://skribbl-clone-backend-kmz9.onrender.com'

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['polling'],
})

socket.on('connect', () => {
  console.log('[Socket.IO] Connected:', socket.id)
})

socket.on('connect_error', (error) => {
  console.error('[Socket.IO] Connection error:', error.message)
})

socket.on('disconnect', (reason) => {
  console.warn('[Socket.IO] Disconnected:', reason)
})


import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import GamePage from './pages/GamePage'
import type { GameRoom, Player } from './components/game/GameTypes'
import { settingOptions } from './components/game/GameTypes'
import type { PlayerAvatar } from './components/layout/AvatarSelector'
import { socket } from './lib/socket'

type SavedPlayer = {
  username: string
  language: string
}

type ServerPlayer = {
  id: string
  name: string
  points: number
  color: string
  face: string
  eye?: PlayerAvatar['eye']
  mouth?: PlayerAvatar['mouth']
  isHost: boolean
}

type ServerRoom = {
  code: string
  settings: Record<string, string | number>
  players: ServerPlayer[]
  status: string
  isPrivate?: boolean
  round?: number
  drawerId?: string | null
  customWordsOnly?: boolean
}

const PLAYER_STORAGE_KEY = 'skribbl-local-player'
const SESSION_STORAGE_KEY = 'skribbl-session'

type ConnectionStatus =
  | 'connecting'
  | 'reconnecting'
  | 'connected'
  | 'disconnected'

function loadPlayer(): SavedPlayer {
  try {
    const saved = localStorage.getItem(PLAYER_STORAGE_KEY)

    if (saved) {
      const parsed = JSON.parse(saved)

      if (
        typeof parsed.username === 'string' &&
        typeof parsed.language === 'string'
      ) {
        return parsed
      }
    }
  } catch {
    // Continue with default player details.
  }

  return { username: '', language: 'English' }
}

function getSetting(
  settings: Record<string, string>,
  names: string[],
  fallback: string,
): string {
  for (const name of names) {
    const value = settings[name]
    if (value !== undefined && value !== '') return value
  }

  return fallback
}

function toServerSettings(settings: Record<string, string>) {
  const hintsValue = getSetting(settings, ['Hints', 'hints'], 'On')

  return {
    maxPlayers: Number(
      getSetting(settings, ['Max Players', 'maxPlayers', 'players'], '8'),
    ),
    drawTime: Number(
      getSetting(settings, ['Draw Time', 'drawTime', 'drawtime'], '80'),
    ),
    rounds: Number(getSetting(settings, ['Rounds', 'rounds'], '3')),
    wordCount: Number(
      getSetting(settings, ['Word Count', 'wordCount', 'wordcount'], '3'),
    ),
    hints:
      hintsValue.toLowerCase() === 'off' ||
      hintsValue.toLowerCase() === 'disabled'
        ? 0
        : Math.max(0, Number(hintsValue) || 2),
    gameMode: getSetting(
      settings,
      ['Game Mode', 'gameMode', 'wordMode'],
      'Normal',
    ),
  }
}

function toGameRoom(serverRoom: ServerRoom): GameRoom {
  const players: Player[] = serverRoom.players.map((player, index) => ({
    ...player,
    rank: index + 1,
  }))

  const serverSettings = serverRoom.settings ?? {}

  const settings: Record<string, string> = {
    'Max Players': String(
      serverSettings.maxPlayers ?? serverSettings.players ?? 8,
    ),
    'Draw Time': String(
      serverSettings.drawTime ?? serverSettings.drawtime ?? 80,
    ),
    Rounds: String(serverSettings.rounds ?? 3),
    'Word Count': String(
      serverSettings.wordCount ?? serverSettings.wordcount ?? 3,
    ),
    Hints: Number(serverSettings.hints ?? 2) === 0 ? 'Off' : 'On',
    'Game Mode': String(serverSettings.gameMode ?? 'Normal'),
  }

  const status =
    serverRoom.status === 'playing' ||
    serverRoom.status === 'choosing' ||
    serverRoom.status === 'roundEnded'
      ? 'playing'
      : serverRoom.status === 'finished'
        ? 'finished'
        : 'lobby'

  return {
    code: serverRoom.code,
    hostId: players.find((player) => player.isHost)?.id ?? '',
    players,
    settings,
    status,
    isPrivate: serverRoom.isPrivate ?? true,
  }
}

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  const [savedPlayer, setSavedPlayer] = useState<SavedPlayer>(loadPlayer)
  const [username, setUsername] = useState(savedPlayer.username)
  const [language, setLanguage] = useState(savedPlayer.language)
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    socket.connected ? 'connected' : 'connecting',
  )
  const [connectionError, setConnectionError] = useState('')

  const previousPathRef = useRef(location.pathname)
  const restoredSessionRef = useRef<{
    socketId: string
    roomCode: string
  } | null>(null)

  
useEffect(() => {
  const previousPath = previousPathRef.current
  previousPathRef.current = location.pathname

  if (previousPath === '/game' && location.pathname !== '/game') {
    if (socket.connected) {
      socket.emit('leave_room')
    }

    setRoom(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    restoredSessionRef.current = null
    setIsSettingsOpen(false)
  }
}, [location.pathname])


  const savePlayerDetails = useCallback(
    (name: string, selectedLanguage: string) => {
      const details = {
        username: name.trim(),
        language: selectedLanguage,
      }

      setUsername(details.username)
      setLanguage(details.language)
      setSavedPlayer(details)

      try {
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(details))
      } catch {
        // The game can still run without local storage.
      }
    },
    [],
  )

  useEffect(() => {
    const onCreated = (payload: {
      room: ServerRoom
      sessionToken?: string
    }) => {
      if (socket.id) {
        restoredSessionRef.current = {
          socketId: socket.id,
          roomCode: payload.room.code.toUpperCase(),
        }
      }

      if (payload.sessionToken) {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            token: payload.sessionToken,
            roomCode: payload.room.code,
          }),
        )
      }

      console.log('[Room] Created:', payload.room.code)
      setRoom(toGameRoom(payload.room))
      setError('')
      setIsSettingsOpen(false)
      navigate(`/game?room=${payload.room.code}`)
    }

    const onJoined = (payload: {
      room: ServerRoom
      sessionToken?: string
    }) => {
      if (socket.id) {
        restoredSessionRef.current = {
          socketId: socket.id,
          roomCode: payload.room.code.toUpperCase(),
        }
      }

      if (payload.sessionToken) {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            token: payload.sessionToken,
            roomCode: payload.room.code,
          }),
        )
      }

      console.log('[Room] Joined:', payload.room.code)
      setRoom(toGameRoom(payload.room))
      setError('')
      setIsSettingsOpen(false)
      navigate(`/game?room=${payload.room.code}`)
    }

    const onSessionRestored = (payload: {
      room: ServerRoom
      sessionToken?: string
    }) => {
      if (socket.id) {
        restoredSessionRef.current = {
          socketId: socket.id,
          roomCode: payload.room.code.toUpperCase(),
        }
      }

      if (payload.sessionToken) {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            token: payload.sessionToken,
            roomCode: payload.room.code,
          }),
        )
      }

      setRoom(toGameRoom(payload.room))
      setError('')

      if (location.pathname !== '/game') {
        navigate(`/game?room=${payload.room.code}`)
      }
    }

    const onSessionRestoreFailed = (payload: {
      roomCode?: string
      definitive?: boolean
      message?: string
    }) => {
      const requestedRoomCode = new URLSearchParams(location.search)
        .get('room')
        ?.toUpperCase()

      if (
        !payload.definitive ||
        (payload.roomCode &&
          requestedRoomCode &&
          payload.roomCode.toUpperCase() !== requestedRoomCode)
      ) {
        setError(payload.message || 'Unable to restore the room yet.')
        return
      }

      restoredSessionRef.current = null
      localStorage.removeItem(SESSION_STORAGE_KEY)
      setRoom(null)
      setError(payload.message || 'Could not restore your previous game session.')
      navigate('/')
    }

    const onRoomState = (serverRoom: ServerRoom) => {
      setRoom((currentRoom) => {
        if (currentRoom && currentRoom.code !== serverRoom.code) {
          return currentRoom
        }

        return toGameRoom(serverRoom)
      })
    }

    const onError = (payload: { message?: string }) => {
      const message = payload.message || 'Something went wrong.'

      console.error('[Socket.IO] Game error:', message)
      setError(message)
      window.alert(message)
    }

    socket.on('room_created', onCreated)
    socket.on('room_joined', onJoined)
    socket.on('session_restored', onSessionRestored)
    socket.on('session_restore_failed', onSessionRestoreFailed)
    socket.on('room_state', onRoomState)
    socket.on('game_error', onError)

    return () => {
      socket.off('room_created', onCreated)
      socket.off('room_joined', onJoined)
      socket.off('session_restored', onSessionRestored)
      socket.off('session_restore_failed', onSessionRestoreFailed)
      socket.off('room_state', onRoomState)
      socket.off('game_error', onError)
    }
  }, [navigate, location.pathname, location.search])

  useEffect(() => {
    const onConnect = () => {
      setConnectionStatus('connected')
      setConnectionError('')
    }

    const onConnectError = (connectionError: Error) => {
      setConnectionStatus(
        socket.active ? 'reconnecting' : 'disconnected',
      )
      setConnectionError(connectionError.message)
    }

    const onDisconnect = (reason: string) => {
      const reconnectsAutomatically =
        reason !== 'io server disconnect' && reason !== 'io client disconnect'

      setConnectionStatus(
        reconnectsAutomatically ? 'reconnecting' : 'disconnected',
      )
      setConnectionError(reason)
    }

    const onReconnectAttempt = () => {
      setConnectionStatus('reconnecting')
    }

    const onReconnectFailed = () => {
      setConnectionStatus('disconnected')
    }

    socket.on('connect', onConnect)
    socket.on('connect_error', onConnectError)
    socket.on('disconnect', onDisconnect)
    socket.io.on('reconnect_attempt', onReconnectAttempt)
    socket.io.on('reconnect_failed', onReconnectFailed)

    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
      socket.off('disconnect', onDisconnect)
      socket.io.off('reconnect_attempt', onReconnectAttempt)
      socket.io.off('reconnect_failed', onReconnectFailed)
    }
  }, [])

  // Restore the same player after a full browser refresh.
  useEffect(() => {
    const attemptRestore = () => {
      if (location.pathname !== '/game') return

      const urlCode = new URLSearchParams(location.search)
        .get('room')
        ?.toUpperCase()

      if (!urlCode || !socket.id) return

      try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY)
        if (!raw) return

        const saved = JSON.parse(raw) as {
          token?: string
          roomCode?: string
        }

        if (
          !saved.token ||
          !saved.roomCode ||
          saved.roomCode.toUpperCase() !== urlCode
        ) {
          return
        }

        const restoredSession = restoredSessionRef.current
        if (
          restoredSession?.socketId === socket.id &&
          restoredSession.roomCode === urlCode
        ) {
          return
        }

        socket.emit('restore_session', {
          token: saved.token,
          roomCode: saved.roomCode,
        })
        restoredSessionRef.current = {
          socketId: socket.id,
          roomCode: urlCode,
        }
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }

    socket.on('connect', attemptRestore)

    if (socket.connected) {
      attemptRestore()
    }

    return () => {
      socket.off('connect', attemptRestore)
    }
  }, [location.pathname, location.search, room?.code])

  // Keep local room state aligned with the room code in the URL.
  useEffect(() => {
    if (location.pathname !== '/game') return

    const code = new URLSearchParams(location.search).get('room')

    if (!code) {
      setRoom(null)
      return
    }

    setRoom((currentRoom) => {
      if (currentRoom && currentRoom.code !== code.toUpperCase()) {
        return null
      }

      return currentRoom
    })
  }, [location.pathname, location.search])

  const ensureSocketConnected = () => {
    if (socket.connected) return true

    if (connectionStatus === 'disconnected') {
      setConnectionStatus('connecting')
      setConnectionError('')
      socket.connect()
    }

    return false
  }

  const openGame = (
    name: string,
    selectedLanguage: string,
    avatar: PlayerAvatar,
  ) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      window.alert('Enter your name first.')
      return
    }

    if (!ensureSocketConnected()) {
      return
    }

    savePlayerDetails(trimmedName, selectedLanguage)
    setRoom(null)
    setError('')

    console.log('[Quick Play] Sending request:', trimmedName)

    socket.emit('quick_play', {
      playerName: trimmedName,
      avatar,
    })
  }

  const createRoom = (
    name: string,
    selectedLanguage: string,
    avatar: PlayerAvatar,
  ) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      window.alert('Enter your name first.')
      return
    }

    if (!ensureSocketConnected()) {
      return
    }

    savePlayerDetails(trimmedName, selectedLanguage)
    setError('')

    const settings = Object.fromEntries(
      settingOptions.map((setting) => [
        setting.name,
        String(setting.initial),
      ]),
    ) as Record<string, string>

    console.log('[Private Room] Creating room:', trimmedName)

    socket.emit('create_room', {
      playerName: trimmedName,
      isPrivate: true,
      settings: toServerSettings(settings),
      customWords: [],
      customWordsOnly: false,
      avatar,
    })
  }

  const joinRoom = (
    name: string,
    selectedLanguage: string,
    roomCode: string,
    avatar: PlayerAvatar,
  ) => {
    const trimmedName = name.trim()
    const code = roomCode.trim().toUpperCase()

    if (!trimmedName || !code) {
      window.alert('Enter your name and room code.')
      return
    }

    if (!ensureSocketConnected()) {
      return
    }

    savePlayerDetails(trimmedName, selectedLanguage)
    setError('')

    console.log('[Join Room] Sending request:', code)

    socket.emit('join_room', {
      playerName: trimmedName,
      code,
      avatar,
    })
  }

  const updateRoomSettings = (settings: Record<string, string>) => {
    if (!room) return

    const currentPlayer = room.players.find(
      (player) => player.id === socket.id,
    )

    if (!currentPlayer?.isHost) {
      setError('Only the room host can change room settings.')
      return
    }

    if (room.status !== 'lobby') {
      setError('Room settings cannot be changed after the game starts.')
      return
    }

    if (!socket.connected) {
      setError('The connection to the game server was lost.')
      return
    }

    setError('')

    socket.emit('update_room_settings', {
      settings: toServerSettings(settings),
    })
  }

  const retryConnection = () => {
    if (socket.connected) return

    setConnectionStatus('connecting')
    setConnectionError('')
    socket.connect()
  }

  const connectionMessage =
    connectionStatus === 'connecting'
      ? 'Connecting to the game server...'
      : connectionStatus === 'reconnecting'
        ? `Connection interrupted. Retrying...${
            connectionError ? ` (${connectionError})` : ''
          }`
        : `Unable to connect to the game server. Check your connection and retry.${
            connectionError ? ` (${connectionError})` : ''
          }`

  return (
    <>
      {error && (
        <div role="alert" className="network-error">
          {error}
        </div>
      )}
      {connectionStatus !== 'connected' && (
        <div
          role={connectionStatus === 'disconnected' ? 'alert' : 'status'}
          aria-live="polite"
          className={`connection-status${connectionStatus === 'disconnected' ? ' connection-status--error' : ''}`}
        >
          <span>{connectionMessage}</span>
          {connectionStatus === 'disconnected' && (
            <button type="button" onClick={retryConnection}>
              Retry
            </button>
          )}
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onPlay={openGame}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />
          }
        />

        <Route
          path="/game"
          element={
            <GamePage
              username={username || 'Player'}
              language={language}
              room={room}
              onRoomSettingsChange={updateRoomSettings}
              isSettingsOpen={isSettingsOpen}
              isPrivateRoom={room?.isPrivate ?? true}
              onToggleSettings={() =>
                setIsSettingsOpen((open) => !open)
              }
              onCloseSettings={() => setIsSettingsOpen(false)}
              onReturnToLobby={() => navigate('/')}
            />
          }
        />

        <Route
          path="*"
          element={
            <LandingPage
              onPlay={openGame}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App

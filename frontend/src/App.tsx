import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import GamePage from './pages/GamePage'

import type {
  GameRoom,
  Player,
} from './components/game/GameTypes'

import { settingOptions } from './components/game/GameTypes'

const ROOMS_STORAGE_KEY = 'skribbl-local-rooms'
const PLAYER_STORAGE_KEY = 'skribbl-local-player'

type SavedPlayer = {
  username: string
  language: string
}

function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const values = new Uint32Array(6)

  crypto.getRandomValues(values)

  return Array.from(
    values,
    (value) => characters[value % characters.length],
  ).join('')
}

function createUniqueRoomCode(rooms: GameRoom[]): string {
  let code = generateRoomCode()

  while (rooms.some((room) => room.code === code)) {
    code = generateRoomCode()
  }

  return code
}

function loadRooms(): GameRoom[] {
  try {
    const savedRooms = localStorage.getItem(ROOMS_STORAGE_KEY)

    if (!savedRooms) return []

    const parsed: unknown = JSON.parse(savedRooms)

    if (!Array.isArray(parsed)) return []

    return parsed as GameRoom[]
  } catch {
    return []
  }
}

function loadPlayer(): SavedPlayer {
  try {
    const savedPlayer = localStorage.getItem(PLAYER_STORAGE_KEY)

    if (savedPlayer) {
      const parsed: unknown = JSON.parse(savedPlayer)

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'username' in parsed &&
        'language' in parsed &&
        typeof parsed.username === 'string' &&
        typeof parsed.language === 'string'
      ) {
        return {
          username: parsed.username,
          language: parsed.language,
        }
      }
    }
  } catch {
    // Use the default player details if saved data is invalid.
  }

  return {
    username: '',
    language: 'English',
  }
}

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  const [rooms, setRooms] = useState<GameRoom[]>(loadRooms)
  const [savedPlayer, setSavedPlayer] =
    useState<SavedPlayer>(loadPlayer)

  const [username, setUsername] = useState(savedPlayer.username)
  const [language, setLanguage] = useState(savedPlayer.language)

  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(
    null,
  )

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPrivateRoom, setIsPrivateRoom] = useState(false)

  const room =
    rooms.find((item) => item.code === selectedRoomCode) ?? null

  // Persist rooms locally so refreshing the page does not erase them.
  useEffect(() => {
    try {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms))
    } catch (error) {
      console.error('Could not save local rooms:', error)
    }
  }, [rooms])

  // Persist the current player's details.
  useEffect(() => {
    try {
      localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify(savedPlayer),
      )
    } catch (error) {
      console.error('Could not save player details:', error)
    }
  }, [savedPlayer])

  // Restore the selected room from a room-code URL after refresh.
  useEffect(() => {
    if (location.pathname !== '/game') return

    const queryCode = new URLSearchParams(location.search)
      .get('room')
      ?.trim()
      .toUpperCase()

    if (!queryCode) return

    const matchingRoom = rooms.find(
      (item) => item.code === queryCode,
    )

    if (matchingRoom) {
      setSelectedRoomCode(matchingRoom.code)
      setIsPrivateRoom(true)
    }
  }, [location.pathname, location.search, rooms])

  const savePlayerDetails = (
    name: string,
    selectedLanguage: string,
  ) => {
    const playerDetails = {
      username: name.trim(),
      language: selectedLanguage,
    }

    setUsername(playerDetails.username)
    setLanguage(playerDetails.language)
    setSavedPlayer(playerDetails)
  }

  const openGame = (name: string, selectedLanguage: string) => {
    savePlayerDetails(name, selectedLanguage)

    setSelectedRoomCode(null)
    setIsPrivateRoom(false)
    setIsSettingsOpen(false)

    navigate('/game')
  }

  const createRoom = (
    name: string,
    selectedLanguage: string,
  ) => {
    const currentRooms = rooms
    const roomCode = createUniqueRoomCode(currentRooms)
    const hostId = crypto.randomUUID()

    const host: Player = {
      id: hostId,
      name: name.trim(),
      points: 0,
      color: '#ff3434',
      face: '☺',
      rank: 1,
      isHost: true,
    }

    const settings = Object.fromEntries(
      settingOptions.map((setting) => [
        setting.name,
        setting.initial,
      ]),
    )

    const newRoom: GameRoom = {
      code: roomCode,
      hostId,
      players: [host],
      settings,
      status: 'lobby',
      isPrivate: true,
    }

    setRooms((currentRooms) => [...currentRooms, newRoom])
    savePlayerDetails(name, selectedLanguage)

    setSelectedRoomCode(roomCode)
    setIsPrivateRoom(true)
    setIsSettingsOpen(false)

    navigate(`/game?room=${roomCode}`)
  }

  const joinRoom = (
    name: string,
    selectedLanguage: string,
    roomCode: string,
  ) => {
    const normalizedCode = roomCode.trim().toUpperCase()

    if (!normalizedCode) {
      window.alert('Please enter a room code.')
      return
    }

    const targetRoom = rooms.find(
      (item) => item.code === normalizedCode,
    )

    if (!targetRoom) {
      window.alert(
        'Room not found. Check the code. Local rooms are available only in this browser storage.',
      )
      return
    }

    if (targetRoom.status !== 'lobby') {
      window.alert('This room has already started or finished.')
      return
    }

    const existingPlayer = targetRoom.players.find(
      (player) =>
        player.name.toLowerCase() === name.trim().toLowerCase(),
    )

    if (existingPlayer) {
      window.alert('A player with that name is already in this room.')
      return
    }

    const playerLimit = Number(targetRoom.settings.players)

    if (
      Number.isFinite(playerLimit) &&
      playerLimit > 0 &&
      targetRoom.players.length >= playerLimit
    ) {
      window.alert('This room has reached its player limit.')
      return
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      points: 0,
      color: '#5367ff',
      face: '☺',
      rank: targetRoom.players.length + 1,
      isHost: false,
    }

    setRooms((currentRooms) =>
      currentRooms.map((item) =>
        item.code === normalizedCode
          ? {
              ...item,
              players: [...item.players, newPlayer],
            }
          : item,
      ),
    )

    savePlayerDetails(name, selectedLanguage)

    setSelectedRoomCode(normalizedCode)
    setIsPrivateRoom(true)
    setIsSettingsOpen(false)

    navigate(`/game?room=${normalizedCode}`)
  }

  const updateRoomSettings = (
    updatedSettings: Record<string, string>,
  ) => {
    if (!selectedRoomCode) return

    setRooms((currentRooms) =>
      currentRooms.map((item) =>
        item.code === selectedRoomCode
          ? {
              ...item,
              settings: updatedSettings,
            }
          : item,
      ),
    )
  }

  return (
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
            isPrivateRoom={isPrivateRoom}
            onToggleSettings={() =>
              setIsSettingsOpen((open) => !open)
            }
            onCloseSettings={() => setIsSettingsOpen(false)}
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
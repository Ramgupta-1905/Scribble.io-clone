
import { useState } from 'react'
import AvatarSelector, {
  DEFAULT_PLAYER_AVATAR,
} from '../layout/AvatarSelector'
import type { PlayerAvatar } from '../layout/AvatarSelector'
import LandingActions from './LandingActions'

type PlayerSetupProps = {
  onPlay: (
    username: string,
    language: string,
    avatar: PlayerAvatar,
  ) => void
  onCreateRoom: (
    username: string,
    language: string,
    avatar: PlayerAvatar,
  ) => void
  onJoinRoom: (
    username: string,
    language: string,
    roomCode: string,
    avatar: PlayerAvatar,
  ) => void
}

function PlayerSetup({
  onPlay,
  onCreateRoom,
  onJoinRoom,
}: PlayerSetupProps) {
  const [username, setUsername] = useState('')
  const [language, setLanguage] = useState('English')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [selectedAvatar, setSelectedAvatar] =
    useState<PlayerAvatar>(DEFAULT_PLAYER_AVATAR)

  const getPlayerDetails = () => {
    const name = username.trim()

    if (!name) {
      setError('Please enter your name before continuing.')
      return null
    }

    setError('')
    return { name, language }
  }

  const handlePlay = () => {
    const player = getPlayerDetails()
    if (!player) return

    onPlay(player.name, player.language, selectedAvatar)
  }

  const handleCreateRoom = () => {
    const player = getPlayerDetails()
    if (!player) return

    onCreateRoom(player.name, player.language, selectedAvatar)
  }

  const handleJoinRoom = () => {
    const player = getPlayerDetails()
    if (!player) return

    const code = roomCode.trim().toUpperCase()

    if (!code) {
      setError('Please enter a room code.')
      return
    }

    onJoinRoom(
      player.name,
      player.language,
      code,
      selectedAvatar,
    )
  }

  return (
    <section className="player-panel">
      <div className="player-setup">
        <div className="player-fields">
          <input
            type="text"
            placeholder="Enter your name"
            aria-label="Username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value)
              if (error) setError('')
            }}
            maxLength={20}
          />

          <select
            aria-label="Language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
        </div>

        <AvatarSelector
          value={selectedAvatar}
          onChange={setSelectedAvatar}
        />
      </div>

      {error && (
        <p className="player-setup-error" role="alert">
          {error}
        </p>
      )}

      <LandingActions
        onPlay={handlePlay}
        onCreateRoom={handleCreateRoom}
      />

      <div className="join-room-controls">
        <input
          type="text"
          placeholder="Enter room code"
          aria-label="Room code"
          value={roomCode}
          onChange={(event) => {
            setRoomCode(event.target.value.toUpperCase())
            if (error) setError('')
          }}
          maxLength={6}
          autoComplete="off"
        />

        <button type="button" onClick={handleJoinRoom}>
          Join Room
        </button>
      </div>
    </section>
  )
}

export default PlayerSetup

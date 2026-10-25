
import { PixelAvatar, DEFAULT_PLAYER_AVATAR } from '../layout/AvatarSelector'
import type { Player } from './GameTypes'

type PlayerListProps = {
  players: Player[]
  currentPlayerId?: string
  currentDrawerId?: string
  isGameActive?: boolean
}

export default function PlayerList({
  players,
  currentPlayerId,
  currentDrawerId,
  isGameActive = false,
}: PlayerListProps) {
  const rankedPlayers = [...players].sort(
    (a, b) => b.points - a.points,
  )

  return (
    <aside className="player-list" aria-label="Players">
      {rankedPlayers.map((player, index) => {
        const isCurrentPlayer = player.id === currentPlayerId
        const isDrawer =
          isGameActive && player.id === currentDrawerId

        return (
          <div
            key={player.id}
            className={`player-row ${
              isCurrentPlayer ? 'player-active' : ''
            }`}
            aria-label={`${player.name}, ${player.points} points${
              isDrawer ? ', drawing now' : ''
            }`}
          >
            <span className="player-rank">#{index + 1}</span>

            <div className="player-details">
              <strong>
                {player.name}
                {isCurrentPlayer ? ' (You)' : ''}
              </strong>

              <span>
                {player.points} points
                {isDrawer ? ' · Drawing' : ''}
              </span>
            </div>

            
<div
  className="player-avatar"
  aria-hidden="true"
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 30px',
    width: '30px',
    height: '35px',
    position: 'relative',
  }}
>
  <PixelAvatar
    color={player.color || DEFAULT_PLAYER_AVATAR.color}
    eye={player.eye || DEFAULT_PLAYER_AVATAR.eye}
    mouth={player.mouth || DEFAULT_PLAYER_AVATAR.mouth}
    size={30}
    className="player-list-pixel-avatar"
  />
</div>

          </div>
        )
      })}
    </aside>
  )
}

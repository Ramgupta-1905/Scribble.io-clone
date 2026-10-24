
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
              style={{ backgroundColor: player.color }}
              aria-hidden="true"
            >
              {player.face}
            </div>
          </div>
        )
      })}
    </aside>
  )
}

import { players } from './gameTypes'

export default function PlayerList() {
  return (
    <aside className="player-list" aria-label="Players">
      {players.map((player) => (
        <div
          key={player.name}
          className={`player-row ${
            player.name === 'dhuruv (You)' ? 'player-active' : ''
          }`}
        >
          <span className="player-rank">#{player.rank}</span>
          <div className="player-details">
            <strong>{player.name}</strong>
            <span>{player.points} points</span>
          </div>
          <div
            className="player-avatar"
            style={{ backgroundColor: player.color }}
            aria-hidden="true"
          >
            {player.face}
          </div>
        </div>
      ))}
    </aside>
  )
}

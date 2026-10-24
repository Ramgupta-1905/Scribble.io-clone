type GameStatusProps = {
  isSettingsOpen: boolean
  isPrivateRoom: boolean
  hasStarted: boolean
  drawtime: string
  rounds: string
  onToggleSettings: () => void
}

export default function GameStatus({
  isSettingsOpen,
  isPrivateRoom,
  hasStarted,
  drawtime,
  rounds,
  onToggleSettings,
}: GameStatusProps) {
  return (
    <section className="game-status">
      <div className="game-timer">
        <span className="timer-clock">◷</span>
        <strong>{hasStarted ? drawtime : '0'}</strong>
      </div>

      <strong className="round-label">Round 1 of {rounds}</strong>

      <div className="word-hint">
        <span>
          {isPrivateRoom
            ? hasStarted
              ? 'GAME STARTED'
              : 'PRIVATE ROOM'
            : hasStarted
              ? 'GAME STARTED'
              : 'WAITING'}
        </span>
        {hasStarted && <strong>_ _ _ _ _</strong>}
      </div>

      <button
        className="game-settings-button"
        type="button"
        aria-label="Toggle room settings"
        aria-expanded={isSettingsOpen}
        onClick={onToggleSettings}
      >
        ⚙
      </button>
    </section>
  )
}

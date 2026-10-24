
type GameStatusProps = {
  isSettingsOpen: boolean
  isPrivateRoom: boolean
  hasStarted: boolean
  drawtime: string
  rounds: string
  onToggleSettings: () => void
  timeLeft?: number
  currentRound?: number
  wordHint?: string
  drawerName?: string
  isChoosingWord?: boolean
  hasRoundEnded?: boolean
  gameFinished?: boolean
}

export default function GameStatus({
  isSettingsOpen,
  isPrivateRoom,
  hasStarted,
  drawtime,
  rounds,
  onToggleSettings,
  timeLeft,
  currentRound = 1,
  wordHint,
  drawerName,
  isChoosingWord = false,
  hasRoundEnded = false,
  gameFinished = false,
}: GameStatusProps) {
  const displayedTime =
    timeLeft !== undefined
      ? Math.max(0, timeLeft)
      : Math.max(0, Number(drawtime) || 0)

  const statusText = gameFinished
    ? 'GAME FINISHED'
    : hasRoundEnded
      ? 'ROUND COMPLETE'
      : !hasStarted
        ? isPrivateRoom
          ? 'PRIVATE ROOM'
          : 'WAITING'
        : isChoosingWord
          ? 'CHOOSE A WORD'
          : drawerName
            ? `${drawerName} IS DRAWING`
            : 'GAME STARTED'

  return (
    <section className="game-status">
      <div className="game-timer">
        <span className="timer-clock" aria-hidden="true">
          ◷
        </span>
        <strong aria-label={`Time remaining: ${displayedTime} seconds`}>
          {hasStarted && !hasRoundEnded && !gameFinished
            ? displayedTime
            : '0'}
        </strong>
      </div>

      <strong className="round-label">
        Round {currentRound} of {rounds || '3'}
      </strong>

      <div className="word-hint" aria-live="polite">
        <span>{statusText}</span>

        {hasStarted && !gameFinished && (
          <strong>
            {hasRoundEnded
              ? 'WORD REVEALED'
              : isChoosingWord
                ? 'Choose your word'
                : wordHint || '_ _ _ _ _'}
          </strong>
        )}
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

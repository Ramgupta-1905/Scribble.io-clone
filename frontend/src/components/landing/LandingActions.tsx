type LandingActionsProps = {
  onPlay: () => void
  onCreateRoom: () => void
}

function LandingActions({
  onPlay,
  onCreateRoom,
}: LandingActionsProps) {
  return (
    <div className="landing-actions">
      <button
        type="button"
        className="play-button"
        onClick={onPlay}
      >
        Play!
      </button>

      <button
        type="button"
        className="create-room-button"
        onClick={onCreateRoom}
      >
        Create Private Room
      </button>
    </div>
  )
}

export default LandingActions
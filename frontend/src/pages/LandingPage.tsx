
import GameLogo from '../components/layout/GameLogo'
import PlayerSetup from '../components/landing/PlayerSetup'
import InfoSections from '../components/landing/InfoSections'
import type { PlayerAvatar } from '../components/layout/AvatarSelector'
import '../styles/LandingPage.css'

type LandingPageProps = {
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

function LandingPage({
  onPlay,
  onCreateRoom,
  onJoinRoom,
}: LandingPageProps) {
  return (
    <main className="landing-page">
      <div className="landing-main">
        <GameLogo />

        <PlayerSetup
          onPlay={onPlay}
          onCreateRoom={onCreateRoom}
          onJoinRoom={onJoinRoom}
        />
      </div>

      <InfoSections />

      <footer className="landing-footer">
        {/* Keep your existing footer content here unchanged. */}
      </footer>
    </main>
  )
}

export default LandingPage

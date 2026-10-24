import GameLogo from '../components/layout/GameLogo'
import PlayerSetup from '../components/landing/PlayerSetup'
import InfoSections from '../components/landing/InfoSections'
import '../styles/LandingPage.css'

type LandingPageProps = {
  onPlay: (username: string, language: string) => void
  onCreateRoom: (username: string, language: string) => void
  onJoinRoom: (
    username: string,
    language: string,
    roomCode: string,
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
        <p>
          An educational clone of Skribbl.io, created for a full-stack
          internship evaluation.
        </p>
        <p>Independent project · Not affiliated with Skribbl.io</p>
      </footer>
    </main>
  )
}

export default LandingPage
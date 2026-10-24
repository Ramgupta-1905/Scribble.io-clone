import GameLogo from '../components/layout/GameLogo'
import PlayerSetup from '../components/landing/PlayerSetup'
import InfoSections from '../components/landing/InfoSections'
import '../styles/LandingPage.css'

type LandingPageProps = {
  onPlay: () => void
  onCreateRoom: () => void
}

function LandingPage({ onPlay, onCreateRoom }: LandingPageProps) {
  return (
    <main className="landing-page">
      <div className="landing-main">
        <GameLogo />

        <PlayerSetup
          onPlay={onPlay}
          onCreateRoom={onCreateRoom}
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
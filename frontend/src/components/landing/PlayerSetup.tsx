
import { useState } from 'react'
import AvatarSelector from '../layout/AvatarSelector'
import LandingActions from './LandingActions'

function PlayerSetup() {
  const [username, setUsername] = useState('')
  const [language, setLanguage] = useState('English')

  return (
    <section className="player-panel">
      <div className="player-setup">
        <div className="player-fields">
          <input
            type="text"
            placeholder="Enter your name"
            aria-label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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

        <AvatarSelector />
      </div>

      <LandingActions />
    </section>
  )
}

export default PlayerSetup

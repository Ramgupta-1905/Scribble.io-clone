import { useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import GamePage from './pages/GamePage'

function AppRoutes() {
  const navigate = useNavigate()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPrivateRoom, setIsPrivateRoom] = useState(false)

  const openGame = () => {
    setIsPrivateRoom(false)
    setIsSettingsOpen(false)
    navigate('/game')
  }

  const createRoom = () => {
    setIsPrivateRoom(true)
    setIsSettingsOpen(false)
    navigate('/game')
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onPlay={openGame}
            onCreateRoom={createRoom}
          />
        }
      />

      <Route
        path="/game"
        element={
          <GamePage
            isSettingsOpen={isSettingsOpen}
            isPrivateRoom={isPrivateRoom}
            onToggleSettings={() =>
              setIsSettingsOpen((open) => !open)
            }
            onCloseSettings={() => setIsSettingsOpen(false)}
          />
        }
      />

      <Route
        path="*"
        element={
          <LandingPage
            onPlay={openGame}
            onCreateRoom={createRoom}
          />
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
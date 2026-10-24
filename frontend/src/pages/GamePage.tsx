import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import '../styles/GamePage.css'

import GameHeader from '../components/game/GameHeader'
import GameStatus from '../components/game/GameStatus'
import PlayerList from '../components/game/PlayerList'
import DrawingCanvas, {
  redrawDrawingCanvas,
} from '../components/game/DrawingCanvas'
import DrawingToolbar from '../components/game/DrawingToolbar'
import RoomSettingsPanel from '../components/game/RoomSettingsPanel'
import ChatPanel from '../components/game/ChatPanel'
import SettingsDrawer from '../components/game/SettingsDrawer'
import {
  initialMessages,
  settingOptions,
} from '../components/game/gameTypes'
import type { ChatMessage, DrawingStroke } from '../components/game/gameTypes'

type GamePageProps = {
  isSettingsOpen: boolean
  isPrivateRoom: boolean
  onToggleSettings: () => void
  onCloseSettings: () => void
  roomMemberCount?: number
}

function GamePage({
  isSettingsOpen,
  isPrivateRoom,
  onToggleSettings,
  onCloseSettings,
  roomMemberCount = 1,
}: GamePageProps) {
  const [guess, setGuess] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [hasStarted, setHasStarted] = useState(false)
  const [startError, setStartError] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy')
  const [customWords, setCustomWords] = useState('')
  const [useCustomWordsOnly, setUseCustomWordsOnly] = useState(false)

  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(
      settingOptions.map((setting) => [setting.name, setting.initial]),
    ),
  )

  const [drawingTool, setDrawingTool] = useState<'pencil' | 'eraser'>('pencil')
  const [drawingColor, setDrawingColor] = useState('#000000')
  const [canvasBackground, setCanvasBackground] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeStrokeRef = useRef<DrawingStroke | null>(null)
  const isDrawingRef = useRef(false)

  const redrawCanvas = useCallback(() => {
    redrawDrawingCanvas(
      canvasRef.current,
      strokes,
      activeStrokeRef.current,
      canvasBackground,
    )
  }, [strokes, canvasBackground])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => redrawCanvas())
    observer.observe(canvas)
    redrawCanvas()
    return () => observer.disconnect()
  }, [redrawCanvas])

  const submitGuess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = guess.trim()
    if (!message) return
    setMessages((current) => [
      ...current,
      { text: `dhuruv (You): ${message}`, type: 'chat' },
    ])
    setGuess('')
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyLabel('Copied!')
    } catch {
      setCopyLabel('Copy failed')
    }
  }

  const startGame = () => {
    if (roomMemberCount < 2) {
      setStartError(
        'At least 2 players must join the room before the game can start.',
      )
      return
    }
    setStartError('')
    setHasStarted(true)
    onCloseSettings()
  }

  const undoLastStroke = () => {
    activeStrokeRef.current = null
    isDrawingRef.current = false
    setStrokes((current) => current.slice(0, -1))
  }

  const clearCanvas = () => {
    activeStrokeRef.current = null
    isDrawingRef.current = false
    setStrokes([])
    setCanvasBackground('#ffffff')
  }

  const isShowingRoomSettings = isPrivateRoom && !hasStarted

  return (
    <main className="game-page">
      <GameHeader />

      <GameStatus
        isSettingsOpen={isSettingsOpen}
        isPrivateRoom={isPrivateRoom}
        hasStarted={hasStarted}
        drawtime={settings.drawtime}
        rounds={settings.rounds}
        onToggleSettings={onToggleSettings}
      />

      <section className="game-layout">
        <PlayerList />

        <div className="drawing-column">
          {isShowingRoomSettings ? (
            <RoomSettingsPanel
              settings={settings}
              onSettingChange={(name, value) =>
                setSettings((current) => ({ ...current, [name]: value }))
              }
              customWords={customWords}
              onCustomWordsChange={setCustomWords}
              useCustomWordsOnly={useCustomWordsOnly}
              onUseCustomWordsOnlyChange={setUseCustomWordsOnly}
              copyLabel={copyLabel}
              onCopyInviteLink={copyInviteLink}
              onStartGame={startGame}
              startError={startError}
              roomMemberCount={roomMemberCount}
            />
          ) : (
            <>
              <DrawingCanvas
                canvasRef={canvasRef}
                drawingTool={drawingTool}
                drawingColor={drawingColor}
                brushSize={brushSize}
                canvasBackground={canvasBackground}
                activeStrokeRef={activeStrokeRef}
                isDrawingRef={isDrawingRef}
                onStrokeFinished={(stroke) =>
                  setStrokes((current) => [...current, stroke])
                }
              />

              <DrawingToolbar
                drawingTool={drawingTool}
                drawingColor={drawingColor}
                brushSize={brushSize}
                strokeCount={strokes.length}
                canvasBackground={canvasBackground}
                onSelectColor={(color) => {
                  setDrawingColor(color)
                  setDrawingTool('pencil')
                }}
                onSelectTool={setDrawingTool}
                onSelectBrushSize={setBrushSize}
                onUndo={undoLastStroke}
                onClear={clearCanvas}
              />
            </>
          )}
        </div>

        <ChatPanel
          messages={messages}
          guess={guess}
          onGuessChange={setGuess}
          onSubmit={submitGuess}
        />
      </section>

      {isSettingsOpen && <SettingsDrawer onClose={onCloseSettings} />}
    </main>
  )
}

export default GamePage

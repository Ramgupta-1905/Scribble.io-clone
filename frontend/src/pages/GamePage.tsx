import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import '../styles/GamePage.css'

import GameHeader from '../components/game/GameHeader'
import GameStatus from '../components/game/GameStatus'
import PlayerList from '../components/game/PlayerList'
import { PixelAvatar } from '../components/layout/AvatarSelector'
import { DEFAULT_PLAYER_AVATAR } from '../components/layout/AvatarSelector'
import DrawingCanvas, {
  redrawDrawingCanvas,
} from '../components/game/DrawingCanvas'
import DrawingToolbar from '../components/game/DrawingToolbar'
import RoomSettingsPanel from '../components/game/RoomSettingsPanel'
import ChatPanel from '../components/game/ChatPanel'
import SettingsDrawer from '../components/game/SettingsDrawer'
import WordChoicePanel from '../components/game/WordChoicePanel'

import { initialMessages, settingOptions } from '../components/game/GameTypes'
import type {
  ChatMessage,
  DrawingStroke,
  GameRoom,
  Player,
} from '../components/game/GameTypes'

import { createHint, parseCustomWords } from '../components/game/GameLogic'
import { socket } from '../lib/socket'

type GamePageProps = {
  username: string
  language: string
  room: GameRoom | null
  onRoomSettingsChange: (settings: Record<string, string>) => void
  isSettingsOpen: boolean
  isPrivateRoom: boolean
  onToggleSettings: () => void
  onCloseSettings: () => void
}

type GameStatePayload = {
  code?: string
  players?: Player[]
  status?: string
  phase?: string
  round?: number
  drawerId?: string | null
  word?: string | null
  wordLength?: number
  timeLeft?: number
  deadline?: number | null
  hasGuessedCorrectly?: boolean
}

type DrawingPayload = {
  x?: number
  y?: number
  color?: string
  size?: number
  tool?: 'pencil' | 'eraser'
}

type ServerMessage = {
  id?: string
  text: string
  type: string
  timestamp?: number
}
type ServerStroke = {
  color?: string
  size?: number
  width?: number
  tool?: 'pencil' | 'eraser'
  points?: Array<{ x: number; y: number }>
}

function normalizeStroke(stroke: ServerStroke): DrawingStroke {
  return {
    color: stroke.color ?? '#000000',
    width: stroke.width ?? stroke.size ?? 4,
    tool: stroke.tool === 'eraser' ? 'eraser' : 'pencil',
    points: (stroke.points ?? []).map((point) => ({
      x: Number(point.x) || 0,
      y: Number(point.y) || 0,
    })),
  }
}

function getInitialSettings(room: GameRoom | null) {
  return room?.settings ?? Object.fromEntries(
    settingOptions.map((setting) => [setting.name, setting.initial]),
  )
}

function getSetting(
  settings: Record<string, string>,
  name: string,
  fallback: string,
) {
  const aliases: Record<string, string[]> = {
    Rounds: ['rounds'],
    'Draw Time': ['drawtime', 'drawTime'],
    'Word Count': ['wordCount', 'wordcount'],
    Hints: ['hints'],
    'Max Players': ['maxPlayers', 'maxplayers'],
  }

  if (settings[name] !== undefined) return settings[name]

  for (const alias of aliases[name] ?? []) {
    if (settings[alias] !== undefined) return settings[alias]
  }

  return fallback
}

function toStrokePoint(payload: DrawingPayload) {
  return {
    x: Number(payload.x) || 0,
    y: Number(payload.y) || 0,
  }
}

export default function GamePage({
  username,
  language,
  room,
  onRoomSettingsChange,
  isSettingsOpen,
  isPrivateRoom,
  onToggleSettings,
  onCloseSettings,
}: GamePageProps) {
  const [guess, setGuess] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [hasStarted, setHasStarted] = useState(false)
  const [isChoosingWord, setIsChoosingWord] = useState(false)
  const [hasRoundEnded, setHasRoundEnded] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [startError, setStartError] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy')

  const [customWords, setCustomWords] = useState('')
  const [useCustomWordsOnly, setUseCustomWordsOnly] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>(
    () => getInitialSettings(room),
  )

  const [timeLeft, setTimeLeft] = useState(0)
  const [serverDeadline, setServerDeadline] = useState<number | null>(null)
  const [drawingTool, setDrawingTool] =
    useState<'pencil' | 'eraser'>('pencil')
  const [drawingColor, setDrawingColor] = useState('#000000')
  const [canvasBackground, setCanvasBackground] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])

  const [revealedLetters, setRevealedLetters] = useState(0)
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false)
  const [selectedWord, setSelectedWord] = useState('')
  const [wordChoices, setWordChoices] = useState<string[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [wordLength, setWordLength] = useState(0)
  const [score, setScore] = useState(0)

  const [gamePlayers, setGamePlayers] = useState<Player[]>(() =>
    room?.players.map((player) => ({ ...player })) ?? [],
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeStrokeRef = useRef<DrawingStroke | null>(null)
  const isDrawingRef = useRef(false)

  const currentPlayer = gamePlayers.find(
    (player) => player.id === socket.id,
  )

  const currentDrawer = gamePlayers.find(
    (player) => player.id === drawerId,
  )

  const isCurrentPlayerDrawing =
    Boolean(socket.id && drawerId && socket.id === drawerId)
  const isCurrentPlayerDrawingRef = useRef(isCurrentPlayerDrawing)
  const roomCode = room?.code

  const drawDuration = Math.max(
    5,
    Number(getSetting(settings, 'Draw Time', '80')) || 80,
  )

  
const redrawCanvas = useCallback(() => {
  redrawDrawingCanvas(
    canvasRef.current,
    strokes,
    activeStrokeRef.current,
    canvasBackground,
  )
}, [strokes, canvasBackground])

  const redrawCanvasRef = useRef(redrawCanvas)

  useEffect(() => {
    redrawCanvasRef.current = redrawCanvas
  }, [redrawCanvas])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const observer = new ResizeObserver(redrawCanvas)
    observer.observe(canvas)
    redrawCanvas()

    return () => observer.disconnect()
  }, [redrawCanvas])

  // Receive room changes, game state, chat, and drawing from the server.
  useEffect(() => {
    if (!roomCode) return

    const requestGameSync = () => {
      if (socket.connected) {
        socket.emit('request_game_sync')
      }
    }

    const handleSessionRestored = (payload: {
      room?: { code?: string }
    }) => {
      if (payload.room?.code === roomCode) {
        requestGameSync()
      }
    }

    const handleRoomState = (payload: {
      code?: string
      players?: Player[]
      settings?: Record<string, string | number>
      status?: string
    }) => {
      if (payload.code !== roomCode) return

      if (payload.players) {
        setGamePlayers(
          payload.players.map((player, index) => ({
            ...player,
            rank: index + 1,
          })),
        )
      }

      if (payload.status === 'playing') {
        setHasStarted(true)
        setGameFinished(false)
      } else if (payload.status === 'finished') {
        setHasStarted(false)
        setGameFinished(true)
      }
    }

    const handleGameState = (payload: GameStatePayload) => {
      if (payload.code && payload.code !== roomCode) return

      if (payload.players) {
        setGamePlayers(
          payload.players.map((player, index) => ({
            ...player,
            rank: index + 1,
          })),
        )
      }

      if (payload.round !== undefined) {
        setRoundNumber(payload.round)
      }

      if (payload.drawerId !== undefined) {
        setDrawerId(payload.drawerId)
      }

      if (payload.deadline !== undefined) {
        setServerDeadline(payload.deadline)
      }

      if (payload.timeLeft !== undefined) {
        setTimeLeft(payload.timeLeft)
      }

      if (payload.wordLength !== undefined) {
        setWordLength(payload.wordLength)
      }

      if (payload.word) {
        setSelectedWord(payload.word)
      }

      if (payload.hasGuessedCorrectly !== undefined) {
        setHasGuessedCorrectly(payload.hasGuessedCorrectly)
      }

      if (payload.phase) {
        setHasStarted(
          ['choosing', 'playing', 'roundEnded'].includes(payload.phase),
        )
        setIsChoosingWord(payload.phase === 'choosing' && payload.drawerId === socket.id)
        setHasRoundEnded(payload.phase === 'roundEnded')
        setGameFinished(payload.phase === 'finished')
      }
    }

    const handleRoundStart = (payload: {
      round: number
      drawerId: string
      drawTime: number
    }) => {
      setRoundNumber(payload.round)
      setDrawerId(payload.drawerId)
      setTimeLeft(payload.drawTime)
      setServerDeadline(null)
      setHasStarted(true)
      setIsChoosingWord(payload.drawerId === socket.id)
      setHasRoundEnded(false)
      setGameFinished(false)
      setHasGuessedCorrectly(false)
      setSelectedWord('')
      setWordLength(0)
      setWordChoices([])
      setRevealedLetters(0)
      setGuess('')
      activeStrokeRef.current = null
      isDrawingRef.current = false
      setStrokes([])
      setCanvasBackground('#ffffff')
    }

    const handleWordChoices = (payload: { words: string[] }) => {
      setWordChoices(payload.words)
      setIsChoosingWord(true)
      setSelectedWord('')
      setTimeLeft(0)
      setServerDeadline(null)
    }

    const handleWordChosen = (payload: {
      word?: string | null
      drawerId?: string
    }) => {
      if (payload.drawerId) setDrawerId(payload.drawerId)

      // The server deliberately sends null to players who are not drawing.
      if (payload.word) {
        setSelectedWord(payload.word)
        setWordLength(payload.word.replace(/\s/g, '').length)
      }

      setWordChoices([])
      setIsChoosingWord(false)
      setHasRoundEnded(false)
      setHasGuessedCorrectly(false)
    }

    const handleChatMessage = (payload: ServerMessage) => {
      setMessages((current) => [
        ...current,
        { text: payload.text, type: payload.type },
      ])
    }

    const handleGuessResult = (payload: {
      correct: boolean
      playerId: string
      points?: number
    }) => {
      if (payload.correct && payload.playerId === socket.id) {
        setHasGuessedCorrectly(true)
        setGuess('')
        setScore((current) => current + (payload.points ?? 0))
      }
    }

    const handleRoundEnd = (payload: {
  word?: string | null
  scores?: Player[]
}) => {
  const word = typeof payload.word === 'string' ? payload.word : ''

  setHasRoundEnded(true)
  setIsChoosingWord(false)
  setSelectedWord(word)
  setWordLength(word.replace(/\s/g, '').length)
  setTimeLeft(0)
  setServerDeadline(null)

  activeStrokeRef.current = null
  isDrawingRef.current = false

  if (payload.scores) {
    setGamePlayers(
      payload.scores.map((player, index) => ({
        ...player,
        rank: index + 1,
      })),
    )
  }
}

    const handleGameOver = (payload: {
      winner: Player | null
      leaderboard?: Player[]
    }) => {
      setGameFinished(true)
      setHasStarted(false)
      setIsChoosingWord(false)
      setHasRoundEnded(false)
      setTimeLeft(0)
      setServerDeadline(null)

      if (payload.leaderboard) {
        setGamePlayers(
          payload.leaderboard.map((player, index) => ({
            ...player,
            rank: index + 1,
          })),
        )
      }

      setMessages((current) => [
        ...current,
        {
          text: payload.winner
            ? `Game over! Winner: ${payload.winner.name} with ${payload.winner.points} points.`
            : 'Game over!',
          type: 'system',
        },
      ])
    }

    const handleDrawingStart = (payload: DrawingPayload) => {
      const point = toStrokePoint(payload)

      activeStrokeRef.current = {
        color: payload.color ?? '#000000',
        width: payload.size ?? 4,
        tool: payload.tool === 'eraser' ? 'eraser' : 'pencil',
        points: [point],
      }

      isDrawingRef.current = true

      setStrokes((current) => [...current])
    }

    
const handleDrawingMove = (payload: DrawingPayload) => {
  const stroke = activeStrokeRef.current
  if (!stroke) return

  stroke.points.push(toStrokePoint(payload))

  // Redraw only for strokes received from other players.
  // The current drawer renders its own pointer movement directly.
  if (!isCurrentPlayerDrawingRef.current) {
    redrawCanvasRef.current()
  }
}


    const handleDrawingEnd = () => {
      const stroke = activeStrokeRef.current
      if (!stroke) return

      activeStrokeRef.current = null
      isDrawingRef.current = false
      setStrokes((current) => [...current, stroke])
    }

    const handleCanvasClear = () => {
      activeStrokeRef.current = null
      isDrawingRef.current = false
      setStrokes([])
      setCanvasBackground('#ffffff')
    }

    const handleDrawUndo = () => {
      setStrokes((current) => current.slice(0, -1))
    }

    const handleError = (payload: { message?: string }) => {
      setStartError(payload.message || 'The server rejected that action.')
    }
    const handleDrawHistory = (payload: { strokes: ServerStroke[] }) => {
  activeStrokeRef.current = null
  isDrawingRef.current = false

  setStrokes((payload.strokes ?? []).map(normalizeStroke))
}
    socket.on('room_state', handleRoomState)
    socket.on('session_restored', handleSessionRestored)
    socket.on('game_state', handleGameState)
    socket.on('round_start', handleRoundStart)
    socket.on('word_choices', handleWordChoices)
    socket.on('word_chosen', handleWordChosen)
    socket.on('chat_message', handleChatMessage)
    socket.on('guess_result', handleGuessResult)
    socket.on('round_end', handleRoundEnd)
    socket.on('game_over', handleGameOver)
    socket.on('draw_start', handleDrawingStart)
    socket.on('draw_move', handleDrawingMove)
    socket.on('draw_end', handleDrawingEnd)
    socket.on('canvas_clear', handleCanvasClear)
    socket.on('draw_undo', handleDrawUndo)
    socket.on('game_error', handleError)
    socket.on('draw_history', handleDrawHistory)

    // Request a snapshot after listeners are registered.
    requestGameSync()

    return () => {
      socket.off('room_state', handleRoomState)
      socket.off('session_restored', handleSessionRestored)
      socket.off('game_state', handleGameState)
      socket.off('round_start', handleRoundStart)
      socket.off('word_choices', handleWordChoices)
      socket.off('word_chosen', handleWordChosen)
      socket.off('chat_message', handleChatMessage)
      socket.off('guess_result', handleGuessResult)
      socket.off('round_end', handleRoundEnd)
      socket.off('game_over', handleGameOver)
      socket.off('draw_start', handleDrawingStart)
      socket.off('draw_move', handleDrawingMove)
      socket.off('draw_end', handleDrawingEnd)
      socket.off('canvas_clear', handleCanvasClear)
      socket.off('draw_undo', handleDrawUndo)
      socket.off('game_error', handleError)
      socket.off('draw_history', handleDrawHistory)
    }
  }, [roomCode])

  useEffect(() => {
    isCurrentPlayerDrawingRef.current = isCurrentPlayerDrawing
  }, [isCurrentPlayerDrawing])

  // Synchronize the room props supplied by App.tsx.
  useEffect(() => {
    if (!room) return

    setSettings(room.settings)
    setGamePlayers(
      room.players.map((player, index) => ({
        ...player,
        rank: index + 1,
      })),
    )
  }, [room])

  // All clients calculate the countdown from the same server deadline.
  // This avoids each browser drifting by one second per local interval.
  
useEffect(() => {
  if (
    !hasStarted ||
    isChoosingWord ||
    hasRoundEnded ||
    gameFinished ||
    serverDeadline === null
  ) {
    return
  }

  const updateCountdown = () => {
    const remaining = Math.max(
      0,
      Math.ceil((serverDeadline - Date.now()) / 1000),
    )

    setTimeLeft((current) =>
      current === remaining ? current : remaining,
    )
  }

  updateCountdown()

  const timer = window.setInterval(updateCountdown, 250)

  return () => window.clearInterval(timer)
}, [
  hasStarted,
  isChoosingWord,
  hasRoundEnded,
  gameFinished,
  serverDeadline,
])


  // Reveal letters gradually for the local display.
  useEffect(() => {
    if (
      !hasStarted ||
      isChoosingWord ||
      hasRoundEnded ||
      gameFinished ||
      isCurrentPlayerDrawing ||
      hasGuessedCorrectly ||
      !wordLength ||
      !selectedWord
    ) {
      return
    }

    const hintsEnabled = getSetting(settings, 'Hints', 'On').toLowerCase() !== 'off'
    if (!hintsEnabled) return

    const timer = window.setInterval(() => {
      setRevealedLetters((current) =>
        Math.min(current + 1, wordLength),
      )
    }, Math.max(5000, (drawDuration * 1000) / 4))

    return () => window.clearInterval(timer)
  }, [
    hasStarted,
    isChoosingWord,
    hasRoundEnded,
    gameFinished,
    isCurrentPlayerDrawing,
    hasGuessedCorrectly,
    wordLength,
    selectedWord,
    settings,
    drawDuration,
  ])

  const startGame = () => {
    setStartError('')

    if (!room) {
      setStartError('Create or join a room before starting a multiplayer game.')
      return
    }

    if (!currentPlayer?.isHost) {
      setStartError('Only the room host can start the game.')
      return
    }

    if (gamePlayers.length < 2) {
      setStartError('At least two players are required to start.')
      return
    }

    const customList = parseCustomWords(customWords)

    if (customWords.length > 20000) {
      setStartError('Custom words must not exceed 20,000 characters.')
      return
    }

    if (customList.some((word) => word.length > 32)) {
      setStartError('Each custom word must contain 1–32 characters.')
      return
    }

    if (useCustomWordsOnly && customList.length < 10) {
      setStartError('Enter at least 10 custom words or turn off custom-words-only mode.')
      return
    }

    socket.emit('start_game')
    onCloseSettings()
  }

  const handleChooseWord = (word: string) => {
    if (
      !isCurrentPlayerDrawing ||
      !isChoosingWord ||
      !wordChoices.includes(word)
    ) {
      return
    }

    socket.emit('word_chosen', { word })
    setSelectedWord(word)
    setWordLength(word.replace(/\s/g, '').length)
    setWordChoices([])
    setIsChoosingWord(false)
    setTimeLeft(drawDuration)
  }

  const submitGuess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = guess.trim()

    if (
      !text ||
      !hasStarted ||
      isChoosingWord ||
      hasRoundEnded ||
      gameFinished ||
      hasGuessedCorrectly ||
      isCurrentPlayerDrawing
    ) {
      return
    }

    socket.emit('guess', { text })
    setGuess('')
  }

  const sendChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = guess.trim()
    if (!text) return

    socket.emit('chat', { text })
    setGuess('')
  }

  const copyInviteLink = async () => {
    const url = room
      ? `${window.location.origin}/game?room=${room.code}`
      : window.location.href

    try {
      await navigator.clipboard.writeText(url)
      setCopyLabel('Copied!')
    } catch {
      setCopyLabel('Copy failed')
    }
  }

  const handleSettingChange = (name: string, value: string) => {
    const updated = { ...settings, [name]: value }
    setSettings(updated)
    onRoomSettingsChange(updated)
  }

  const undoLastStroke = () => {
    if (!isCurrentPlayerDrawing) return

    activeStrokeRef.current = null
    isDrawingRef.current = false
    socket.emit('draw_undo')
    setStrokes((current) => current.slice(0, -1))
  }

  const clearCanvas = () => {
    if (!isCurrentPlayerDrawing) return

    activeStrokeRef.current = null
    isDrawingRef.current = false
    socket.emit('canvas_clear')
    setStrokes([])
    setCanvasBackground('#ffffff')
  }

  const isShowingRoomSettings = isPrivateRoom && !hasStarted

  const isChatDisabled =
    !hasStarted ||
    isChoosingWord ||
    hasRoundEnded ||
    gameFinished ||
    hasGuessedCorrectly ||
    isCurrentPlayerDrawing

  const wordHint =
    hasStarted && !isChoosingWord && !gameFinished
      ? hasRoundEnded || isCurrentPlayerDrawing || hasGuessedCorrectly
        ? selectedWord
        : selectedWord
          ? createHint(selectedWord, revealedLetters)
          : wordLength
            ? Array.from({ length: wordLength }, () => '_').join(' ')
            : undefined
      : undefined

  return (
    <main className="game-page" lang={language}>
      <GameHeader />

      <GameStatus
        isSettingsOpen={isSettingsOpen}
        isPrivateRoom={isPrivateRoom}
        hasStarted={hasStarted}
        drawtime={String(timeLeft)}
        rounds={getSetting(settings, 'Rounds', '3')}
        onToggleSettings={onToggleSettings}
        timeLeft={timeLeft}
        currentRound={roundNumber}
        wordHint={wordHint}
        drawerName={currentDrawer?.name}
        isChoosingWord={isChoosingWord}
        hasRoundEnded={hasRoundEnded}
        gameFinished={gameFinished}
      />

      {startError && (
        <p className="game-error" role="alert">
          {startError}
        </p>
      )}

      
{gameFinished && (
  <div className="winner-overlay" role="dialog" aria-modal="true">
    <div className="winner-card">
      <p className="winner-eyebrow">GAME COMPLETED</p>
      <h2>Final Results</h2>
      <div className="winner-podium">
        {[...gamePlayers]
          .sort((a, b) => b.points - a.points)
          .slice(0, 3)
          .map((player, index) => (
            <div
              className={`podium-player podium-place-${index + 1}`}
              key={player.id}
            >
              <div className="podium-rank">
                {['🥇 1st', '🥈 2nd', '🥉 3rd'][index]}
              </div>

              <PixelAvatar
                color={player.color || DEFAULT_PLAYER_AVATAR.color}
                eye={player.eye || DEFAULT_PLAYER_AVATAR.eye}
                mouth={player.mouth || DEFAULT_PLAYER_AVATAR.mouth}
                size={56}
                className="podium-avatar"
              />

              <p className="podium-name">{player.name}</p>
              <p className="podium-score">{player.points} points</p>
            </div>
          ))}
      </div>

      <button
        type="button"
        className="winner-lobby-button"
        onClick={() => window.location.assign('/')}
      >
        Return to Lobby
      </button>
    </div>
  </div>
)}


      <section className="game-layout">
        <PlayerList
          players={gamePlayers}
          currentPlayerId={socket.id}
          currentDrawerId={drawerId ?? undefined}
          isGameActive={hasStarted && !gameFinished && !hasRoundEnded}
        />

        <div className="drawing-column">
          {isShowingRoomSettings ? (
            <RoomSettingsPanel
              settings={settings}
              onSettingChange={handleSettingChange}
              customWords={customWords}
              onCustomWordsChange={setCustomWords}
              useCustomWordsOnly={useCustomWordsOnly}
              onUseCustomWordsOnlyChange={setUseCustomWordsOnly}
              copyLabel={copyLabel}
              onCopyInviteLink={copyInviteLink}
              onStartGame={startGame}
              startError={startError}
              roomMemberCount={room?.players.length ?? 1}
              roomCode={room?.code}
              isHost={Boolean(room && room.hostId === socket.id)}
            />
          ) : (
            <>
              {isChoosingWord && isCurrentPlayerDrawing && (
                <WordChoicePanel
                  words={wordChoices}
                  onChooseWord={handleChooseWord}
                  choosingPlayerName={username}
                />
              )}

              {!isChoosingWord && (
                <>
                  <DrawingCanvas
                    canvasRef={canvasRef}
                    drawingTool={drawingTool}
                    drawingColor={drawingColor}
                    brushSize={brushSize}
                    canDraw={
                      hasStarted &&
                      isCurrentPlayerDrawing &&
                      !hasRoundEnded &&
                      !gameFinished
                    }
                    activeStrokeRef={activeStrokeRef}
                    isDrawingRef={isDrawingRef}
                    onStrokeFinished={(stroke) => {
                      setStrokes((current) => [...current, stroke])
                    }}
                  />

                  {hasStarted &&
                    isCurrentPlayerDrawing &&
                    !hasRoundEnded &&
                    !gameFinished && (
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
                    )}
                </>
              )}
            </>
          )}
        </div>

        <ChatPanel
          messages={messages}
          guess={guess}
          onGuessChange={setGuess}
          onSubmit={hasStarted ? submitGuess : sendChat}
          disabled={hasStarted ? isChatDisabled : false}
        />
      </section>

      {hasStarted && (
        <div className="local-score" aria-live="polite">
          {username}'s score: {score}
        </div>
      )}

      {isSettingsOpen && <SettingsDrawer onClose={onCloseSettings} />}
    </main>
  )
}
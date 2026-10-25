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
import WordChoicePanel from '../components/game/WordChoicePanel'

import {
  initialMessages,
  settingOptions,
} from '../components/game/GameTypes'

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
    'Max Players': ['maxPlayers', 'maxplayers', 'players'],
    'Game Mode': ['gameMode', 'wordMode'],
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
  const [winner, setWinner] = useState<Player | null>(null)
  const [finalLeaderboard, setFinalLeaderboard] = useState<Player[]>([])
  const [revealedLetters, setRevealedLetters] = useState(0)
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false)
  const [selectedWord, setSelectedWord] = useState('')
  const [wordChoices, setWordChoices] = useState<string[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [wordLength, setWordLength] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeStrokeRef = useRef<DrawingStroke | null>(null)
  const isDrawingRef = useRef(false)

  const currentPlayer = room?.players.find(
    (player) => player.id === socket.id,
  )

  const currentDrawer = room?.players.find(
    (player) => player.id === drawerId,
  )

  const isCurrentPlayerDrawing =
    Boolean(socket.id && drawerId && socket.id === drawerId)

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

  // Receive room updates, game state, drawing events and chat messages.
  useEffect(() => {
    if (!room) return

    const handleRoomState = (payload: {
      code?: string
      players?: Player[]
      settings?: Record<string, string | number>
      status?: string
    }) => {
      if (payload.code !== room.code) return

      if (payload.players) {
        // Preserve server order because it determines turn order.
        setGamePlayersFromServer(payload.players)
      }

      if (payload.settings) {
        setSettings((current) => ({
          ...current,
          'Max Players': String(
            payload.settings?.maxPlayers ??
              payload.settings?.players ??
              current['Max Players'] ??
              '8',
          ),
          'Draw Time': String(
            payload.settings?.drawTime ??
              payload.settings?.drawtime ??
              current['Draw Time'] ??
              '80',
          ),
          Rounds: String(
            payload.settings?.rounds ?? current.Rounds ?? '3',
          ),
          'Word Count': String(
            payload.settings?.wordCount ??
              current['Word Count'] ??
              '3',
          ),
          Hints: Number(
            payload.settings?.hints ?? 2,
          ) === 0 ? 'Off' : 'On',
          'Game Mode': String(
            payload.settings?.gameMode ??
              current['Game Mode'] ??
              'Normal',
          ),
        }))
      }

      if (payload.status === 'playing' || payload.status === 'choosing') {
        setHasStarted(true)
        setGameFinished(false)
      } else if (payload.status === 'finished') {
        setHasStarted(false)
        setGameFinished(true)
      } else if (payload.status === 'lobby') {
        setHasStarted(false)
        setGameFinished(false)
      }
    }

    const handleGameState = (payload: GameStatePayload) => {
      if (payload.code && payload.code !== room.code) return

      if (payload.players) {
        setGamePlayersFromServer(payload.players)
      }

      if (payload.round !== undefined) setRoundNumber(payload.round)

      if (payload.drawerId !== undefined) setDrawerId(payload.drawerId)

      if (payload.deadline !== undefined) {
        setServerDeadline(payload.deadline)
      }

      if (payload.timeLeft !== undefined) setTimeLeft(payload.timeLeft)

      if (payload.wordLength !== undefined) {
        setWordLength(payload.wordLength)
      }

      if (payload.word !== undefined) {
        setSelectedWord(payload.word ?? '')
      }

      if (payload.hasGuessedCorrectly !== undefined) {
        setHasGuessedCorrectly(payload.hasGuessedCorrectly)
      }

      if (payload.phase) {
        setHasStarted(
          ['choosing', 'playing', 'roundEnded'].includes(payload.phase),
        )
        setIsChoosingWord(
          payload.phase === 'choosing' &&
            payload.drawerId === socket.id,
        )
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
      setWinner(null)
      setFinalLeaderboard([])
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

      if (payload.word) {
        setSelectedWord(payload.word)
        setWordLength(payload.word.replace(/\s/g, '').length)
      }

      setWordChoices([])
      setIsChoosingWord(false)
      setHasRoundEnded(false)
      setHasGuessedCorrectly(false)
      setRevealedLetters(0)
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
  playerName?: string
  points?: number
  word?: string
}) => {
  if (!payload.correct) return

  // Show the correct word only to the player who guessed it.
  if (payload.playerId === socket.id) {
    setHasGuessedCorrectly(true)
    setGuess('')

    if (payload.word) {
      setSelectedWord(payload.word)
      setWordLength(payload.word.replace(/\s/g, '').length)
    }
  }
}


    const handleRoundEnd = (payload: {
      word: string
      scores?: Player[]
    }) => {
      setHasRoundEnded(true)
      setIsChoosingWord(false)
      setSelectedWord(payload.word)
      setWordLength(payload.word.replace(/\s/g, '').length)
      setTimeLeft(0)
      setServerDeadline(null)
      activeStrokeRef.current = null
      isDrawingRef.current = false

      if (payload.scores) setGamePlayersFromServer(payload.scores)
    }

    const handleGameOver = (payload: {
  winner: Player | null
  leaderboard?: Player[]
}) => {
  const finalWinner =
    payload.winner ??
    [...(payload.leaderboard ?? [])].sort(
      (a, b) => b.points - a.points,
    )[0] ??
    null

  setWinner(finalWinner)
  setFinalLeaderboard(
    [...(payload.leaderboard ?? (finalWinner ? [finalWinner] : []))]
      .sort((a, b) => b.points - a.points)
      .slice(0, 3),
  )
  setGameFinished(true)
  setHasStarted(false)
  setIsChoosingWord(false)
  setHasRoundEnded(false)
  setTimeLeft(0)
  setServerDeadline(null)

  if (payload.leaderboard) {
    setGamePlayersFromServer(payload.leaderboard)
  }

  setMessages((current) => [
    ...current,
    {
      text: finalWinner
        ? `Game over! Winner: ${finalWinner.name} with ${finalWinner.points} points.`
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
      redrawCanvas()
    }

    const handleDrawingMove = (payload: DrawingPayload) => {
      if (!activeStrokeRef.current) return

      activeStrokeRef.current.points.push(toStrokePoint(payload))
      redrawCanvas()
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
      // The server broadcasts undo to every client, including the drawer.
      setStrokes((current) => current.slice(0, -1))
      activeStrokeRef.current = null
      isDrawingRef.current = false
    }

    const handleError = (payload: { message?: string }) => {
      setStartError(payload.message || 'The server rejected that action.')
    }

    socket.on('room_state', handleRoomState)
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

    return () => {
      socket.off('room_state', handleRoomState)
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
    }
  }, [room?.code, redrawCanvas])

  function setGamePlayersFromServer(players: Player[]) {
    // Do not sort this list by points: the server's player order controls turns.
    setGamePlayers(
      players.map((player, index) => ({
        ...player,
        rank: index + 1,
      })),
    )
  }

  const [gamePlayers, setGamePlayers] = useState<Player[]>(() =>
    room?.players.map((player, index) => ({
      ...player,
      rank: index + 1,
    })) ?? [],
  )

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

  // Countdown uses the authoritative server deadline.
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
      setTimeLeft(
        Math.max(0, Math.ceil((serverDeadline - Date.now()) / 1000)),
      )
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 200)

    return () => window.clearInterval(timer)
  }, [
    hasStarted,
    isChoosingWord,
    hasRoundEnded,
    gameFinished,
    serverDeadline,
  ])

  // Hints reveal letters only for guessing players.
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

    const hintsEnabled =
      getSetting(settings, 'Hints', 'On').toLowerCase() !== 'off'

    if (!hintsEnabled) return

    const configuredHints = Math.max(
      0,
      Number(getSetting(settings, 'Hints', '2')) || 0,
    )

    if (configuredHints === 0) return

    const interval = Math.max(
      5000,
      (drawDuration * 1000) / (configuredHints + 1),
    )

    const timer = window.setInterval(() => {
      setRevealedLetters((current) =>
        Math.min(current + 1, wordLength),
      )
    }, interval)

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
      setStartError(
        'Enter at least 10 custom words or turn off custom-words-only mode.',
      )
      return
    }

    if (!socket.connected) {
      setStartError('You are disconnected from the game server. Reconnect and try again.')
      return
    }

    socket.emit('start_game', {
      settings: toServerSettings(settings),
      customWords: customList,
      customWordsOnly: useCustomWordsOnly,
    })

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

    // Let the server broadcast the undo once to every client.
    socket.emit('draw_undo')
  }

  const clearCanvas = () => {
    if (!isCurrentPlayerDrawing) return

    activeStrokeRef.current = null
    isDrawingRef.current = false
    socket.emit('canvas_clear')
  }

  const isShowingRoomSettings =
    isPrivateRoom &&
    !hasStarted &&
    Boolean(currentPlayer?.isHost)

  const isChatDisabled =
    !hasStarted ||
    isChoosingWord ||
    hasRoundEnded ||
    gameFinished ||
    hasGuessedCorrectly ||
    isCurrentPlayerDrawing

  const wordHint =
    hasStarted && !isChoosingWord && !gameFinished
      ? hasRoundEnded ||
        isCurrentPlayerDrawing ||
        hasGuessedCorrectly
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
        <div
          className="winner-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-title"
        >
          <div className="winner-results">
            <h2 id="winner-title">Result</h2>
            <div className="winner-podium">
              {(finalLeaderboard.length > 0
                ? finalLeaderboard
                : winner
                  ? [winner]
                  : []
              ).map((player, index) => (
                <div className={`podium-player podium-place-${index + 1}`} key={player.id}>
                  <div className="podium-avatar" aria-hidden="true">
                    {player.face || '☺'}
                  </div>
                  <div className="podium-rank">#{index + 1}</div>
                  <p className="podium-name">{player.name}</p>
                  <p className="podium-score">{player.points} points</p>
                </div>
              ))}
            </div>
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
              isHost={Boolean(currentPlayer?.isHost)}
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
                    canvasBackground={canvasBackground}
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

      {isSettingsOpen && <SettingsDrawer onClose={onCloseSettings} />}
    </main>
  )
}

function toServerSettings(settings: Record<string, string>) {
  const hints = settings.Hints ?? 'On'

  return {
    maxPlayers: Number(settings['Max Players'] ?? 8),
    drawTime: Number(settings['Draw Time'] ?? 80),
    rounds: Number(settings.Rounds ?? 3),
    wordCount: Number(settings['Word Count'] ?? 3),
    hints:
      hints.toLowerCase() === 'off'
        ? 0
        : Math.max(1, Number(hints) || 2),
    gameMode: settings['Game Mode'] ?? 'Normal',
  }
}
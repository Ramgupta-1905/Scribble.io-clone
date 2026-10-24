
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
  players as mockPlayers,
} from '../components/game/GameTypes'

import type {
  ChatMessage,
  DrawingStroke,
  GameRoom,
  Player,
} from '../components/game/GameTypes'

import {
  addPlayerPoints,
  chooseRandomWord,
  createHint,
  createWordChoices,
  getNextTurn,
  parseCustomWords,
} from '../components/game/GameLogic'

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

function getInitialSettings(room: GameRoom | null) {
  return (
    room?.settings ??
    Object.fromEntries(
      settingOptions.map((setting) => [setting.name, setting.initial]),
    )
  )
}

function getSetting(
  settings: Record<string, string>,
  name: string,
  fallback: string,
): string {
  const aliases: Record<string, string[]> = {
    Rounds: ['rounds'],
    'Draw Time': ['drawtime', 'drawTime'],
    'Word Count': ['wordCount', 'wordcount'],
    Hints: ['hints'],
    'Max Players': ['maxPlayers', 'maxplayers'],
    'Game Mode': ['gameMode', 'gamemode'],
  }

  if (settings[name] !== undefined) return settings[name]

  for (const alias of aliases[name] ?? []) {
    if (settings[alias] !== undefined) return settings[alias]
  }

  return fallback
}

function createLocalPlayer(name: string): Player {
  return {
    id: `local-${name.trim().toLowerCase() || 'player'}`,
    name: name.trim() || 'Player',
    points: 0,
    color: '#ff3434',
    face: '☺',
    rank: 1,
    isHost: true,
  }
}

function normalizeHints(value: string | undefined): number {
  if (
    !value ||
    value.toLowerCase() === 'off' ||
    value.toLowerCase() === 'disabled'
  ) {
    return 0
  }

  const count = Number(value)
  return Number.isFinite(count) ? Math.max(0, count) : 0
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
  const [drawingTool, setDrawingTool] =
    useState<'pencil' | 'eraser'>('pencil')
  const [drawingColor, setDrawingColor] = useState('#000000')
  const [canvasBackground, setCanvasBackground] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const [strokes, setStrokes] = useState<DrawingStroke[]>([])

  const [revealedLetters, setRevealedLetters] = useState(0)
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false)
  const [score, setScore] = useState(0)
  const [selectedWord, setSelectedWord] = useState('')
  const [wordChoices, setWordChoices] = useState<string[]>([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [currentDrawerIndex, setCurrentDrawerIndex] = useState(0)

  // Keep gamePlayers in turn order. Sort only when displaying scores.
  const [gamePlayers, setGamePlayers] = useState<Player[]>(() => {
    if (room) return room.players.map((player) => ({ ...player }))

    return [
      createLocalPlayer(username),
      ...mockPlayers
        .filter(
          (player) =>
            player.name.toLowerCase() !== username.toLowerCase(),
        )
        .map((player) => ({ ...player })),
    ]
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeStrokeRef = useRef<DrawingStroke | null>(null)
  const isDrawingRef = useRef(false)
  const quickPlayStartedRef = useRef(false)
  const lastAnnouncedTurnRef = useRef('')
  const scoredTurnsRef = useRef(new Set<string>())

  const configuredRoundCount = Math.max(
    1,
    Number(getSetting(settings, 'Rounds', '3')) || 3,
  )

  const drawDuration = Math.max(
    5,
    Number(getSetting(settings, 'Draw Time', '80')) || 80,
  )

  const configuredWordCount = Math.max(
    1,
    Number(getSetting(settings, 'Word Count', '3')) || 3,
  )

  const currentDrawer = gamePlayers[currentDrawerIndex]

  const currentPlayer = gamePlayers.find(
    (player) => player.name.toLowerCase() === username.toLowerCase(),
  )

  const isCurrentPlayerDrawing = Boolean(
    currentDrawer &&
      currentPlayer &&
      currentDrawer.id === currentPlayer.id,
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

    const observer = new ResizeObserver(redrawCanvas)
    observer.observe(canvas)
    redrawCanvas()

    return () => observer.disconnect()
  }, [redrawCanvas])

  // Synchronize room players and settings when the room changes.
  useEffect(() => {
    if (!room) return

    setGamePlayers((current) =>
      room.players.map((roomPlayer) => {
        const previous = current.find(
          (player) => player.id === roomPlayer.id,
        )

        return previous
          ? {
              ...roomPlayer,
              points: previous.points,
              rank: previous.rank,
            }
          : { ...roomPlayer }
      }),
    )

    setSettings(room.settings)
  }, [room])

  // Keep the local player present when no room is supplied.
  useEffect(() => {
    if (room) return

    setGamePlayers((current) => {
      const localPlayer = createLocalPlayer(username)
      const existing = current.find((player) =>
        player.id.startsWith('local-'),
      )

      if (!existing) return [localPlayer, ...current]

      return current.map((player) =>
        player.id === existing.id
          ? { ...localPlayer, points: player.points }
          : player,
      )
    })
  }, [username, room])

  const resetDrawingBoard = useCallback(() => {
    activeStrokeRef.current = null
    isDrawingRef.current = false
    setStrokes([])
    setCanvasBackground('#ffffff')
    setDrawingColor('#000000')
    setDrawingTool('pencil')
    setBrushSize(4)
  }, [])

  /**
   * Begin a player's turn.
   * The local player chooses a word; mock players choose automatically.
   */
  const beginTurn = useCallback(
    (nextRound: number, nextDrawerIndex: number) => {
      if (gamePlayers.length === 0) return

      const safeIndex = nextDrawerIndex % gamePlayers.length
      const drawer = gamePlayers[safeIndex]

      const localDrawer = Boolean(
        currentPlayer && drawer.id === currentPlayer.id,
      )

      setRoundNumber(nextRound)
      setCurrentDrawerIndex(safeIndex)
      setHasRoundEnded(false)
      setHasGuessedCorrectly(false)
      setGuess('')
      setRevealedLetters(0)
      setSelectedWord('')
      setWordChoices([])
      setIsChoosingWord(localDrawer)
      setTimeLeft(localDrawer ? 0 : drawDuration)

      resetDrawingBoard()

      if (localDrawer) {
        const choices = createWordChoices(
          customWords,
          useCustomWordsOnly,
          configuredWordCount,
        )

        setWordChoices(choices)
        setMessages((current) => [
          ...current,
        ])
      } else {
        const word = chooseRandomWord(
          customWords,
          useCustomWordsOnly,
        )

        setSelectedWord(word)
        setMessages((current) => [
          ...current,
          {
            text: `${drawer.name} is drawing now!`,
            type: 'notice',
          },
        ])
      }
    },
    [
      gamePlayers,
      currentPlayer,
      drawDuration,
      customWords,
      useCustomWordsOnly,
      configuredWordCount,
      resetDrawingBoard,
    ],
  )

  const startGame = useCallback(() => {
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

    if (gamePlayers.length === 0) {
      setStartError('At least one player is required to start the game.')
      return
    }

    setStartError('')
    setGameFinished(false)
    setHasStarted(true)
    setHasRoundEnded(false)
    setHasGuessedCorrectly(false)
    setIsChoosingWord(false)
    setRoundNumber(1)
    setCurrentDrawerIndex(0)
    setScore(0)
    setRevealedLetters(0)
    setGuess('')
    setSelectedWord('')
    setWordChoices([])
    setTimeLeft(0)

    lastAnnouncedTurnRef.current = ''
    scoredTurnsRef.current.clear()

    setGamePlayers((current) =>
      current.map((player) => ({
        ...player,
        points: 0,
        rank: 1,
      })),
    )

    const firstDrawer = gamePlayers[0]
    const localDrawer = Boolean(
      currentPlayer && firstDrawer.id === currentPlayer.id,
    )

    resetDrawingBoard()

    setMessages([
      ...initialMessages,
      {
        text: `Game started! ${firstDrawer.name} draws first.`,
        type: 'system',
      },
    ])

    if (localDrawer) {
      setIsChoosingWord(true)
      setWordChoices(
        createWordChoices(
          customWords,
          useCustomWordsOnly,
          configuredWordCount,
        ),
      )
      setTimeLeft(0)

      setMessages((current) => [
        ...current,
      ])
    } else {
      setSelectedWord(
        chooseRandomWord(customWords, useCustomWordsOnly),
      )
      setTimeLeft(drawDuration)
    }

    onCloseSettings()
  }, [
    customWords,
    useCustomWordsOnly,
    configuredWordCount,
    gamePlayers,
    currentPlayer,
    drawDuration,
    onCloseSettings,
    resetDrawingBoard,
  ])

  // Start quick play only once for this mounted game page.
  useEffect(() => {
    if (isPrivateRoom || quickPlayStartedRef.current) return

    quickPlayStartedRef.current = true
    startGame()
  }, [isPrivateRoom, startGame])

  // Run the countdown only after a word has been selected.
  useEffect(() => {
    if (
      !hasStarted ||
      isChoosingWord ||
      hasRoundEnded ||
      gameFinished ||
      !selectedWord
    ) {
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setHasRoundEnded(true)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [
    hasStarted,
    isChoosingWord,
    hasRoundEnded,
    gameFinished,
    selectedWord,
  ])

  // Reveal hints gradually without ending the turn.
  useEffect(() => {
    if (
      !hasStarted ||
      isChoosingWord ||
      hasRoundEnded ||
      gameFinished ||
      hasGuessedCorrectly ||
      !selectedWord
    ) {
      return
    }

    const hintCount = normalizeHints(
      getSetting(settings, 'Hints', 'On'),
    )

    if (hintCount <= 0) return

    const letterCount = selectedWord.replace(/\s/g, '').length
    if (letterCount === 0) return

    const interval = Math.max(
      5000,
      (drawDuration * 1000) / (hintCount + 1),
    )

    const timer = window.setInterval(() => {
      setRevealedLetters((current) =>
        Math.min(current + 1, letterCount),
      )
    }, interval)

    return () => window.clearInterval(timer)
  }, [
    hasStarted,
    isChoosingWord,
    hasRoundEnded,
    gameFinished,
    hasGuessedCorrectly,
    selectedWord,
    settings,
    drawDuration,
  ])

  // Advance only after the current turn's timer has ended.
  useEffect(() => {
    if (
      !hasRoundEnded ||
      !selectedWord ||
      gameFinished ||
      !currentDrawer
    ) {
      return
    }

    const turnKey = `${roundNumber}:${currentDrawer.id}`

    if (lastAnnouncedTurnRef.current === turnKey) return

    lastAnnouncedTurnRef.current = turnKey

    setMessages((current) => [
      ...current,
      {
        text: `Turn complete! The word was "${selectedWord}".`,
        type: 'system',
      },
    ])

    const transitionTimer = window.setTimeout(() => {
      const next = getNextTurn(
        currentDrawerIndex,
        gamePlayers.length,
        roundNumber,
        configuredRoundCount,
      )

      if (next.gameFinished) {
        setGameFinished(true)
        setHasStarted(false)
        setIsChoosingWord(false)
        setTimeLeft(0)

        const winner = [...gamePlayers].sort(
          (a, b) => b.points - a.points,
        )[0]

        setMessages((current) => [
          ...current,
          {
            text: winner
              ? `Game over! Winner: ${winner.name} with ${winner.points} points.`
              : 'Game over!',
            type: 'system',
          },
        ])

        return
      }

      if (next.nextRound !== roundNumber) {
        setMessages((current) => [
          ...current,
          {
            text: `Round ${next.nextRound} of ${configuredRoundCount} begins!`,
            type: 'system',
          },
        ])
      }

      beginTurn(next.nextRound, next.nextPlayerIndex)
    }, 2500)

    return () => window.clearTimeout(transitionTimer)
  }, [
    hasRoundEnded,
    selectedWord,
    gameFinished,
    currentDrawer,
    roundNumber,
    currentDrawerIndex,
    gamePlayers,
    configuredRoundCount,
    beginTurn,
  ])

  const handleChooseWord = (word: string) => {
    if (
      !hasStarted ||
      !isChoosingWord ||
      !isCurrentPlayerDrawing ||
      !wordChoices.includes(word)
    ) {
      return
    }

    setSelectedWord(word)
    setWordChoices([])
    setIsChoosingWord(false)
    setHasGuessedCorrectly(false)
    setRevealedLetters(0)
    setTimeLeft(drawDuration)

    setMessages((current) => [
      ...current,
      {
        text: `${username} is drawing.`,
        type: 'notice',
      },
    ])
  }

  const submitGuess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = guess.trim()

    if (
      !message ||
      !hasStarted ||
      isChoosingWord ||
      hasRoundEnded ||
      gameFinished ||
      hasGuessedCorrectly ||
      !selectedWord ||
      isCurrentPlayerDrawing
    ) {
      return
    }

    if (message.toLowerCase() === selectedWord.toLowerCase()) {
      setMessages((current) => [
        ...current,
        {
          text: `${username} guessed the word correctly!`,
          type: 'success',
        },
      ])

      const turnKey = `${roundNumber}:${currentDrawer?.id ?? ''}`

      if (!scoredTurnsRef.current.has(turnKey)) {
        scoredTurnsRef.current.add(turnKey)
        setScore((current) => current + 100)

        setGamePlayers((current) =>
          addPlayerPoints(current, currentPlayer?.id, 100),
        )
      }

      // A correct guess does not stop the timer.
      setHasGuessedCorrectly(true)
      setGuess('')
      return
    }

    setMessages((current) => [
      ...current,
      { text: `${username}: ${message}`, type: 'chat' },
    ])

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

  const isChatDisabled =
    !hasStarted ||
    isChoosingWord ||
    hasRoundEnded ||
    gameFinished ||
    hasGuessedCorrectly ||
    isCurrentPlayerDrawing

  
const wordHint =
  hasStarted &&
  !isChoosingWord &&
  !gameFinished &&
  selectedWord
    ? hasRoundEnded || isCurrentPlayerDrawing || hasGuessedCorrectly
      ? selectedWord
      : createHint(selectedWord, revealedLetters)
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

      {gameFinished && (
        <div className="game-finished" role="status">
          <h2>Game Over!</h2>
          <p>
            Winner:{' '}
            {[...gamePlayers].sort((a, b) => b.points - a.points)[0]
              ?.name ?? username}
          </p>
          <button type="button" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}

      <section className="game-layout">
        <PlayerList
          players={gamePlayers}
          currentPlayerId={currentPlayer?.id}
          currentDrawerId={currentDrawer?.id}
          isGameActive={
            hasStarted && !gameFinished && !hasRoundEnded
          }
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
                      !isChoosingWord &&
                      !hasRoundEnded &&
                      !gameFinished
                    }
                    activeStrokeRef={activeStrokeRef}
                    isDrawingRef={isDrawingRef}
                    onStrokeFinished={(stroke) =>
                      setStrokes((current) => [...current, stroke])
                    }
                  />

                  {hasStarted &&
                    isCurrentPlayerDrawing &&
                    !isChoosingWord &&
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
          onSubmit={submitGuess}
          disabled={isChatDisabled}
        />
      </section>

      {hasStarted && (
        <div className="local-score" aria-live="polite">
          {username}'s local score: {score}
        </div>
      )}

      {isSettingsOpen && <SettingsDrawer onClose={onCloseSettings} />}
    </main>
  )
}

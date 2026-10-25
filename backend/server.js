
const express = require('express')
const http = require('http')
const cors = require('cors')
const crypto = require('crypto')
const { Server } = require('socket.io')



const app = express()

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'https://skribbl-clone-frontend-vla2.onrender.com'
)
  .split(',')
  .map((url) => url.trim())

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})



const PORT = process.env.PORT || 3001
const rooms = new Map()
const socketRooms = new Map()

const WORDS = [
  'apple', 'airplane', 'bridge', 'butterfly', 'castle',
  'cat', 'cloud', 'computer', 'crown', 'dolphin',
  'elephant', 'flower', 'guitar', 'house', 'island',
  'moon', 'mountain', 'pizza', 'rainbow', 'robot',
  'rocket', 'star', 'sun', 'tiger', 'train',
  'banana', 'bicycle', 'camera', 'clock', 'dog',
  'football', 'ice cream', 'laptop', 'ocean', 'pencil',
  'tree', 'umbrella', 'watermelon', 'book', 'chair',
  'fish', 'phone', 'shoe', 'key', 'lamp',
  'ship', 'turtle', 'monkey', 'sandwich', 'backpack',
  'pizza slice', 'rain', 'snowman', 'dragon', 'piano',
]

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, Number(value) || min))

function cleanName(value) {
  return String(value || '').trim().slice(0, 24)
}

function cleanCustomWords(value) {
  if (!Array.isArray(value)) return []

  return [...new Set(
    value
      .filter((word) => typeof word === 'string')
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0 && word.length <= 32),
  )].slice(0, 200)
}

function getSetting(raw, keys, fallback) {
  for (const key of keys) {
    if (raw && raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
      return raw[key]
    }
  }

  return fallback
}

function normalizeSettings(raw = {}, existing = {}) {
  const value = (keys, fallback) =>
    getSetting(raw, keys, getSetting(existing, keys, fallback))

  const rawMode = String(
    value(['gameMode', 'Game Mode', 'wordMode'], 'Normal'),
  )

  const allowedModes = [
    'Normal',
    'Easy',
    'Hard',
    'Quick',
    'Custom',
    'Hidden',
    'Combination',
  ]

  const rawHints = value(['hints', 'Hints'], 2)
  const hints = ['off', 'disabled', 'false', '0'].includes(
    String(rawHints).toLowerCase(),
  )
    ? 0
    : clamp(rawHints, 0, 5)

  const maxPlayers = clamp(
    value(['maxPlayers', 'Max Players', 'players'], 8),
    2,
    20,
  )

  const drawTime = clamp(
    value(['drawTime', 'Draw Time', 'drawtime'], 80),
    15,
    240,
  )

  const rounds = clamp(
    value(['rounds', 'Rounds'], 3),
    1,
    10,
  )

  const wordCount = clamp(
    value(['wordCount', 'Word Count', 'wordcount'], 3),
    1,
    5,
  )

  return {
    maxPlayers,
    drawTime: rawMode === 'Quick' ? Math.min(drawTime, 30) : drawTime,
    rounds,
    wordCount,
    hints,
    gameMode: allowedModes.includes(rawMode) ? rawMode : 'Normal',
  }
}

function normalizeAvatar(raw, fallbackColor = '#ff3434') {
  // Treat absent or malformed client avatar data as a default avatar.
  // This keeps older clients and direct room joins from crashing the server.
  const avatar = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const allowedEyes = ['round', 'square', 'sleepy', 'angry', 'surprised', 'wink', 'star', 'glasses', 'hearts', 'happy', 'crying']
  const allowedMouths = ['none', 'smile', 'straight', 'open', 'frown', 'grin', 'tongue', 'laugh', 'teeth', 'smirk', 'tiny']

  return {
    color: typeof avatar.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(avatar.color) ? avatar.color : fallbackColor,
    eye: typeof avatar.eye === 'string' && allowedEyes.includes(avatar.eye) ? avatar.eye : 'round',
    mouth: typeof avatar.mouth === 'string' && allowedMouths.includes(avatar.mouth) ? avatar.mouth : 'smile',
  }
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    points: player.points,
    color: player.color || '#ffe600',
    face: player.face,
    eye: player.eye || 'round',
    mouth: player.mouth || 'smile',
    isHost: player.isHost,
  }
}

function publicRoom(room) {
  const drawer = room.players[room.drawerIndex]

  return {
    code: room.code,
    isPrivate: room.isPrivate !== false,
    settings: { ...room.settings },
    players: room.players.map(publicPlayer),
    status: room.status,
    round: room.round,
    drawerId: drawer?.id ?? null,
    drawTime: room.settings.drawTime,
    wordCount: room.settings.wordCount,
    hints: room.settings.hints,
    word: null,
    customWordsOnly: room.customWordsOnly,
  }
}

function publicRoomSummary(room) {
  return {
    code: room.code,
    isPrivate: room.isPrivate !== false,
    playerCount: room.players.length,
    maxPlayers: room.settings.maxPlayers,
    status: room.status,
    gameMode: room.settings.gameMode,
  }
}


function getPublicRoomSummaries() {
  return [...rooms.values()]
    .filter(
      (room) =>
        room.isPrivate === false &&
        room.status !== 'finished' &&
        room.players.length < 20,
    )
    .map(publicRoomSummary)
}


function emitPublicRooms() {
  io.emit('public_rooms', getPublicRoomSummaries())
}

function emitRoom(room) {
  io.to(room.code).emit('room_state', publicRoom(room))
}

function sendChat(room, text, type = 'notice') {
  io.to(room.code).emit('chat_message', {
    id: crypto.randomUUID(),
    text,
    type,
    timestamp: Date.now(),
  })
}

function getRoomForSocket(socket) {
  const code = socketRooms.get(socket.id)
  return code ? rooms.get(code) : null
}

function getPlayer(room, socket) {
  return room?.players.find((player) => player.id === socket.id)
}

function fail(socket, message) {
  socket.emit('game_error', { message })
}

function makeCode() {
  let code

  do {
    code = crypto.randomBytes(3).toString('hex').toUpperCase()
  } while (rooms.has(code))

  return code
}

function clearTurnTimer(room) {
  if (room.timer) clearTimeout(room.timer)
  room.timer = null
  room.deadline = null
}

function clearTransitionTimer(room) {
  if (room.transitionTimer) clearTimeout(room.transitionTimer)
  room.transitionTimer = null
}

function shuffle(items) {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function chooseWords(room) {
  const source = room.customWordsOnly
    ? room.customWords
    : [...room.customWords, ...WORDS]

  let pool = [...new Set(
    source
      .map((word) => String(word).trim().toLowerCase())
      .filter(Boolean),
  )]

  if (room.settings.gameMode === 'Easy') {
    pool = pool.filter((word) => word.replace(/\s/g, '').length <= 6)
  } else if (room.settings.gameMode === 'Hard') {
    pool = pool.filter((word) => word.replace(/\s/g, '').length >= 7)
  }

  // Never substitute built-in words in custom-only mode.
  return shuffle(pool).slice(
    0,
    Math.min(room.settings.wordCount, pool.length),
  )
}

function sendGameState(room) {
  const drawer = room.players[room.drawerIndex]

  for (const player of room.players) {
    const isDrawer = player.id === drawer?.id
    const alreadyGuessed = room.correctGuessers.has(player.id)

    io.to(player.id).emit('game_state', {
      ...publicRoom(room),
      phase: room.status,
      round: room.round,
      drawerId: drawer?.id ?? null,
      word: isDrawer || alreadyGuessed ? room.word : null,
      wordLength: room.word?.replace(/\s/g, '').length ?? 0,
      timeLeft: room.deadline
        ? Math.max(0, Math.ceil((room.deadline - Date.now()) / 1000))
        : 0,
      deadline: room.deadline,
      hasGuessedCorrectly: alreadyGuessed,
    })
  }
}

function finishGame(room) {
  clearTurnTimer(room)
  clearTransitionTimer(room)

  room.status = 'finished'

  const leaderboard = [...room.players].sort(
    (a, b) => b.points - a.points,
  )

  io.to(room.code).emit('game_over', {
    winner: leaderboard[0] ? publicPlayer(leaderboard[0]) : null,
    leaderboard: leaderboard.map(publicPlayer),
  })

  emitRoom(room)
  emitPublicRooms()
}

function endTurn(room) {
  if (room.status !== 'playing') return

  clearTurnTimer(room)

  // Award each successful guesser's pending points once, at turn end.
  for (const [playerId, points] of room.pendingScores) {
    const player = room.players.find((item) => item.id === playerId)
    if (player) player.points += points
  }
  room.pendingScores.clear()

  room.status = 'roundEnded'

  io.to(room.code).emit('round_end', {
    word: room.word,
    scores: room.players.map(publicPlayer),
    nextDrawer: null,
  })

  sendChat(room, `Turn complete! The word was "${room.word}".`, 'system')
  emitRoom(room)

  clearTransitionTimer(room)

  room.transitionTimer = setTimeout(() => {
    room.transitionTimer = null

    if (!rooms.has(room.code) || room.players.length === 0) return
    if (room.status !== 'roundEnded') return

    const finishedRound = room.drawerIndex >= room.players.length - 1

    if (finishedRound) {
      if (room.round >= room.settings.rounds) {
        finishGame(room)
        return
      }

      room.round += 1
      sendChat(room, `Round ${room.round} begins!`, 'system')
    }

    room.drawerIndex = (room.drawerIndex + 1) % room.players.length
    beginTurn(room)
  }, 2500)
}

function beginTurn(room) {
  clearTurnTimer(room)
  clearTransitionTimer(room)

  if (room.players.length === 0) return

  room.drawerIndex = clamp(
    room.drawerIndex,
    0,
    room.players.length - 1,
  )

  room.status = 'choosing'
  room.word = null
  room.correctGuessers.clear()
  room.pendingScores.clear()
  room.strokes = []
  room.activeStroke = null
  room.hintCount = 0

  const drawer = room.players[room.drawerIndex]
  room.wordOptions = chooseWords(room)

  if (room.wordOptions.length === 0) {
    sendChat(
      room,
      'No words match these settings. Add custom words or change the game mode.',
      'warning',
    )

    room.status = 'lobby'
    emitRoom(room)
    emitPublicRooms()
    return
  }

  io.to(room.code).emit('round_start', {
    round: room.round,
    drawerId: drawer.id,
    drawTime: room.settings.drawTime,
    wordOptions: null,
  })

  io.to(drawer.id).emit('word_choices', {
    words: room.wordOptions,
  })

  sendChat(room, `${drawer.name} is choosing a word.`, 'notice')
  sendGameState(room)
  emitRoom(room)
}

function startTimer(room) {
  clearTurnTimer(room)

  room.deadline = Date.now() + room.settings.drawTime * 1000

console.log('[TIMER START]', {
  room: room.code,
  phase: room.status,
  drawTime: room.settings.drawTime,
  deadline: room.deadline,
})

  room.timer = setTimeout(() => {
    endTurn(room)
  }, room.settings.drawTime * 1000)

  sendGameState(room)
}

function createRoom(socket, payload = {}) {
  if (getRoomForSocket(socket)) {
    fail(socket, 'Leave your current room before creating another.')
    return
  }

  const name = cleanName(payload.playerName)

  if (!name) {
    fail(socket, 'Enter your name first.')
    return
  }

  const settings = normalizeSettings(
  payload.isPrivate === false
    ? { ...(payload.settings || {}), maxPlayers: 20 }
    : payload.settings,
)
  const customWords = cleanCustomWords(payload.customWords)
  const customWordsOnly = Boolean(payload.customWordsOnly)

  if (customWordsOnly && customWords.length < 10) {
    fail(socket, 'Custom-only mode requires at least 10 valid custom words.')
    return
  }

  const code = makeCode()

  const room = {
    code,
    isPrivate: payload.isPrivate !== false,
    hostId: socket.id,
    players: [{
      id: socket.id,
      sessionToken: crypto.randomUUID(),
      reconnectTimer: null,
      name,
      points: 0,
      ...normalizeAvatar(payload.avatar, '#ff3434'),
      face: '☺',
      isHost: true,
    }],
    settings,
    customWords,
    customWordsOnly,
    status: 'lobby',
    round: 1,
    drawerIndex: 0,
    word: null,
    wordOptions: [],
    correctGuessers: new Set(),
    pendingScores: new Map(),
    strokes: [],
    activeStroke: null,
    hintCount: 0,
    timer: null,
    deadline: null,
    transitionTimer: null,
  }

  rooms.set(code, room)
  socket.join(code)
  socketRooms.set(socket.id, code)

  socket.emit('room_created', {
    code,
    sessionToken: room.players[0].sessionToken,
    room: publicRoom(room),
  })

  emitRoom(room)
  emitPublicRooms()
}

function updateRoomSettings(socket, payload = {}) {
  const room = getRoomForSocket(socket)

  if (!room) {
    fail(socket, 'Join a room before changing its settings.')
    return
  }

  if (room.hostId !== socket.id) {
    fail(socket, 'Only the room host can change settings.')
    return
  }

  if (room.status !== 'lobby') {
    fail(socket, 'Room settings cannot be changed after the game starts.')
    return
  }

  const nextSettings = normalizeSettings(
    payload.settings || {},
    room.settings,
  )

  if (nextSettings.maxPlayers < room.players.length) {
    fail(
      socket,
      `The player limit cannot be lower than the ${room.players.length} players already in the room.`,
    )
    return
  }

  const customWords = payload.customWords === undefined
    ? room.customWords
    : cleanCustomWords(payload.customWords)

  const customWordsOnly = payload.customWordsOnly === undefined
    ? room.customWordsOnly
    : Boolean(payload.customWordsOnly)

  if (customWordsOnly && customWords.length < 10) {
    fail(socket, 'Custom-only mode requires at least 10 valid words.')
    return
  }

  room.settings = nextSettings
  room.customWords = customWords
  room.customWordsOnly = customWordsOnly

  emitRoom(room)
  sendChat(room, 'The host updated the room settings.', 'system')
  emitPublicRooms()
}


function joinRoom(socket, payload = {}) {
  if (getRoomForSocket(socket)) {
    fail(socket, 'Leave your current room before joining another.')
    return
  }

  const code = String(payload.code || '').trim().toUpperCase()
  const room = rooms.get(code)

  if (!room) {
    fail(socket, 'Room not found. Check the room code and try again.')
    return
  }

  const isPublic = room.isPrivate === false

  // Private rooms remain lobby-only.
  if (
    room.status === 'finished' ||
    (!isPublic && room.status !== 'lobby')
  ) {
    fail(socket, 'This game is no longer accepting players.')
    return
  }

  const playerName = cleanName(payload.playerName)

  if (!playerName) {
    fail(socket, 'Enter your name first.')
    return
  }

  // Public rooms have a hard limit of 20 players.
  const playerLimit = isPublic
    ? 20
    : room.settings.maxPlayers

  if (room.players.length >= playerLimit) {
    fail(socket, 'This room is full.')
    return
  }

  if (
    room.players.some(
      (player) =>
        player.name.toLowerCase() === playerName.toLowerCase(),
    )
  ) {
    fail(socket, 'That player name is already taken in this room.')
    return
  }

  const player = {
    id: socket.id,
    sessionToken: crypto.randomUUID(),
    reconnectTimer: null,
    name: playerName,
    points: 0,
    ...normalizeAvatar(payload.avatar, ['#ff3434', '#3478f6', '#21a675', '#a855f7'][room.players.length % 4]),
    face: '☺',
    isHost: false,
  }

  room.players.push(player)

  socket.join(code)
  socketRooms.set(socket.id, code)

  socket.emit('room_joined', {
    code,
    sessionToken: player.sessionToken,
    room: publicRoom(room),
  })

  sendChat(room, `${playerName} joined the room.`, 'system')

  // Start a public game once, when the second player arrives.
  if (isPublic && room.status === 'lobby' && room.players.length >= 2) {
    startPublicGame(room)
    return
  }

  emitRoom(room)
  emitPublicRooms()

  // Synchronize a player who joins an already-running public game.
  if (
    isPublic &&
    ['choosing', 'playing', 'roundEnded'].includes(room.status)
  ) {
    sendGameState(room)

    if (room.status === 'playing') {
      socket.emit('draw_history', {
        strokes: room.strokes,
      })
    }
  }
}




function startPublicGame(room) {
  if (
    room.isPrivate !== false ||
    room.status !== 'lobby' ||
    room.players.length < 2
  ) {
    return
  }

  room.players.forEach((player) => {
    player.points = 0
  })

  room.round = 1
  room.drawerIndex = 0

  console.log(
    `[Public Game] Starting ${room.code} with ${room.players.length} players`,
  )

  sendChat(room, 'Public game started!', 'system')

  // beginTurn() sets the status, generates word choices,
  // emits round_start and word_choices, and sends game state.
  beginTurn(room)
}



function startGame(socket, payload = {}) {
  const room = getRoomForSocket(socket)

  if (!room) return fail(socket, 'Join a room first.')

  if (room.hostId !== socket.id) {
    return fail(socket, 'Only the host can start.')
  }

  if (
  room.status === 'finished' ||
  (room.status !== 'lobby' && room.isPrivate !== false)
) {
  fail(socket, 'This game has already started.')
  return
}

  if (room.players.length < 2) {
    return fail(socket, 'At least two players are required.')
  }

  const customWords = payload.customWords === undefined
    ? room.customWords
    : cleanCustomWords(payload.customWords)

  const customWordsOnly = payload.customWordsOnly === undefined
    ? room.customWordsOnly
    : Boolean(payload.customWordsOnly)

  if (customWordsOnly && customWords.length < 10) {
    return fail(socket, 'Custom-only mode requires at least 10 valid words.')
  }

  const nextSettings = normalizeSettings(
    payload.settings || {},
    room.settings,
  )

  if (nextSettings.maxPlayers < room.players.length) {
    return fail(socket, 'The player limit is lower than the current room size.')
  }

  room.customWords = customWords
  room.customWordsOnly = customWordsOnly
  room.settings = nextSettings

  // Check that custom-only words can produce choices for the selected mode.
  const availableWords = chooseWords({
    ...room,
    settings: {
      ...room.settings,
      wordCount: room.settings.wordCount,
    },
  })

  if (availableWords.length === 0) {
    return fail(
      socket,
      'No words match this game mode. Add more custom words or change the mode.',
    )
  }

  room.players.forEach((player) => {
    player.points = 0
  })

  room.round = 1
  room.drawerIndex = 0
  room.status = 'choosing'

  sendChat(room, 'Game started!', 'system')
  emitPublicRooms()
  beginTurn(room)
}

function chooseWord(socket, payload = {}) {
  const room = getRoomForSocket(socket)

  if (!room || room.status !== 'choosing') return

  const drawer = room.players[room.drawerIndex]

  if (drawer?.id !== socket.id) {
    fail(socket, 'Only the drawer can choose a word.')
    return
  }

  const word = String(payload.word || '').trim().toLowerCase()

  if (!room.wordOptions.includes(word)) {
    fail(socket, 'Please choose one of the offered words.')
    return
  }

  room.word = word
  room.status = 'playing'
  room.strokes = []
  room.activeStroke = null

  io.to(room.code).emit('canvas_clear', {})
  sendChat(room, `${drawer.name} is drawing.`, 'notice')

  // Send the answer privately to the drawer.
  io.to(drawer.id).emit('word_chosen', { word })

  // Other clients receive no secret word.
  io.to(room.code).emit('word_chosen', {
    drawerId: drawer.id,
    word: null,
  })

  sendGameState(room)
  startTimer(room)
}



function drawEvent(socket, event, payload = {}) {
  const room = getRoomForSocket(socket)

  console.log('[DRAW EVENT RECEIVED]', {
    event,
    socketId: socket.id,
    roomCode: socketRooms.get(socket.id) || null,
    roomFound: Boolean(room),
    phase: room?.status,
    drawerId: room?.players[room.drawerIndex]?.id ?? null,
  })

  if (!room || room.status !== 'playing') {
    console.log('[DRAW REJECTED: ROOM/PHASE]', {
      event,
      socketId: socket.id,
      roomFound: Boolean(room),
      phase: room?.status,
    })
    return
  }


  const drawer = room.players[room.drawerIndex]

  if (!drawer || drawer.id !== socket.id) {
    console.log('[DRAW REJECTED: NOT DRAWER]', {
      event,
      socketId: socket.id,
      expectedDrawerId: drawer?.id,
      room: room.code,
    })
    return
  }

  if (!['draw_start', 'draw_move', 'draw_end'].includes(event)) {
    return
  }

  const safePayload = {
    x: clamp(payload?.x, 0, 10000),
    y: clamp(payload?.y, 0, 10000),
    color: /^#[0-9a-f]{6}$/i.test(payload?.color || '')
      ? payload.color
      : '#000000',
    size: clamp(payload?.size, 1, 60),
    tool: payload?.tool === 'eraser' ? 'eraser' : 'pencil',
  }

  if (event === 'draw_start') {
    room.activeStroke = {
      color: safePayload.color,
      size: safePayload.size,
      width: safePayload.size,
      tool: safePayload.tool,
      points: [{ x: safePayload.x, y: safePayload.y }],
    }

    console.log('[DRAW START ACCEPTED]', {
      socketId: socket.id,
      room: room.code,
    })

    // Tell other players a new stroke has started.
    socket.to(room.code).emit('draw_start', safePayload)
    return
  }

  if (event === 'draw_move') {
    if (!room.activeStroke) {
      console.log('[DRAW MOVE IGNORED: NO ACTIVE STROKE]', {
        room: room.code,
        socketId: socket.id,
      })
      return
    }

    room.activeStroke.points.push({
      x: safePayload.x,
      y: safePayload.y,
    })

    socket.to(room.code).emit('draw_move', safePayload)
    return
  }

  if (event === 'draw_end') {
    if (!room.activeStroke) {
      console.log('[DRAW END IGNORED: NO ACTIVE STROKE]', {
        room: room.code,
        socketId: socket.id,
      })
      return
    }

    const completedStroke = room.activeStroke
    room.strokes.push(completedStroke)
    room.activeStroke = null

    // Finish the active stroke on other players' canvases.
    socket.to(room.code).emit('draw_end', safePayload)

    // Keep a full-stroke event available for clients that use it.
    socket.to(room.code).emit('draw_data', {
      stroke: completedStroke,
    })
  }
}



function clearCanvas(socket) {
  const room = getRoomForSocket(socket)

  if (!room || room.status !== 'playing') return
  if (room.players[room.drawerIndex]?.id !== socket.id) return

  room.strokes = []
  room.activeStroke = null
  io.to(room.code).emit('canvas_clear', {})
}

function undoDrawing(socket) {
  const room = getRoomForSocket(socket)

  if (!room || room.status !== 'playing') return
  if (room.players[room.drawerIndex]?.id !== socket.id) return

  room.strokes.pop()
  room.activeStroke = null
  io.to(room.code).emit('draw_undo', {})
}

function restoreSession(socket, payload = {}) {
  const token = String(payload.token || '')
  const code = String(payload.roomCode || '').trim().toUpperCase()

  if (!token || !code) {
    return fail(socket, 'Your saved game session is invalid.')
  }

  const room = rooms.get(code)
  const player = room?.players.find((item) => item.sessionToken === token)

  if (!room || !player || room.status === 'finished') {
    socket.emit('session_restore_failed', {
      message: 'This game session has expired. Please join the room again.',
    })
    return
  }

  if (player.reconnectTimer) {
    clearTimeout(player.reconnectTimer)
    player.reconnectTimer = null
  }

  const oldId = player.id

  if (oldId !== socket.id) {
    socketRooms.delete(oldId)
    player.id = socket.id

    if (room.hostId === oldId) {
      room.hostId = socket.id
    }

    if (room.correctGuessers.delete(oldId)) {
      room.correctGuessers.add(socket.id)
    }

    if (room.pendingScores.has(oldId)) {
      const points = room.pendingScores.get(oldId)
      room.pendingScores.delete(oldId)
      room.pendingScores.set(socket.id, points)
    }
  }

  socket.join(room.code)
  socketRooms.set(socket.id, room.code)

  socket.emit('session_restored', {
    code: room.code,
    sessionToken: player.sessionToken,
    room: publicRoom(room),
  })
}

function leaveRoom(socket) {
  const room = getRoomForSocket(socket)
  if (!room) return

  const leavingPlayer = getPlayer(room, socket)
  if (leavingPlayer?.reconnectTimer) {
    clearTimeout(leavingPlayer.reconnectTimer)
    leavingPlayer.reconnectTimer = null
  }
  const wasHost = room.hostId === socket.id
  const leavingIndex = room.players.findIndex(
    (player) => player.id === socket.id,
  )
  const wasDrawer = leavingIndex === room.drawerIndex

  socketRooms.delete(socket.id)
  socket.leave(room.code)

  if (leavingPlayer) {
    room.players = room.players.filter((player) => player.id !== socket.id)
    room.correctGuessers.delete(socket.id)
    sendChat(room, `${leavingPlayer.name} left the room.`, 'system')
  }

  if (room.players.length === 0) {
    clearTurnTimer(room)
    clearTransitionTimer(room)
    rooms.delete(room.code)
    emitPublicRooms()
    return
  }

  if (wasHost) {
    room.hostId = room.players[0].id

    room.players.forEach((player, index) => {
      player.isHost = index === 0
    })

    sendChat(room, `${room.players[0].name} is now the room host.`, 'system')
  }

  if (leavingIndex >= 0 && leavingIndex < room.drawerIndex) {
    room.drawerIndex -= 1
  } else if (wasDrawer) {
    room.drawerIndex = room.drawerIndex % room.players.length
  }

  if (room.status !== 'lobby' && room.status !== 'finished') {
    if (room.players.length < 2) {
      clearTurnTimer(room)
      clearTransitionTimer(room)

      room.status = 'lobby'
      room.word = null
      room.wordOptions = []
      room.correctGuessers.clear()
      room.strokes = []
      room.activeStroke = null
      room.drawerIndex = 0

      sendChat(room, 'Waiting for another player to join.', 'system')
      emitPublicRooms()
    } else if (wasDrawer && room.status !== 'roundEnded') {
      clearTurnTimer(room)
      clearTransitionTimer(room)

      room.status = 'roundEnded'

      io.to(room.code).emit('round_end', {
        word: room.word,
        scores: room.players.map(publicPlayer),
        nextDrawer: null,
      })

      room.transitionTimer = setTimeout(() => {
        room.transitionTimer = null

        if (
          rooms.has(room.code) &&
          room.players.length >= 2 &&
          room.status === 'roundEnded'
        ) {
          beginTurn(room)
        }
      }, 1500)
    } else if (room.status === 'playing' &&
      room.correctGuessers.size >= room.players.length - 1) {
      endTurn(room)
    }
  }

  emitRoom(room)
  emitPublicRooms()
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Skribbl Clone API',
    status: 'running',
    rooms: rooms.size,
  })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

io.on('connection', (socket) => {
  console.log('Connected:', socket.id)

  socket.on('create_room', (payload) => createRoom(socket, payload))
  socket.on('join_room', (payload) => joinRoom(socket, payload))
  
  
socket.on('quick_play', (payload = {}) => {
  if (getRoomForSocket(socket)) {
    fail(socket, 'You are already in a room.')
    return
  }

  const playerName = cleanName(payload.playerName)

  if (!playerName) {
    fail(socket, 'Enter your name first.')
    return
  }

  // Prefer the public room with the most players, provided
  // it is not full and does not already contain this username.
  const availableRoom = [...rooms.values()]
    .filter(
      (room) =>
        room.isPrivate === false &&
        room.status !== 'finished' &&
        room.players.length < 20 &&
        !room.players.some(
          (player) =>
            player.name.toLowerCase() === playerName.toLowerCase(),
        ),
    )
    .sort((a, b) => b.players.length - a.players.length)[0]

  if (availableRoom) {
    joinRoom(socket, {
      playerName,
      avatar: payload.avatar,
      code: availableRoom.code,
    })
    return
  }

  // No available public room: create a new one.
  createRoom(socket, {
    playerName,
    avatar: payload.avatar,
    isPrivate: false,
    settings: {
      maxPlayers: 20,
    },
  })
})


  
  socket.on('get_public_rooms', () => {
    socket.emit('public_rooms', getPublicRoomSummaries())
  })

  socket.on('update_room_settings', (payload) =>
    updateRoomSettings(socket, payload),
  )

  socket.on('start_game', (payload) => startGame(socket, payload))
  socket.on('word_chosen', (payload) => chooseWord(socket, payload))
  socket.on('guess', (payload) => submitGuess(socket, payload))
  socket.on('chat', (payload) => submitChat(socket, payload))

  for (const event of ['draw_start', 'draw_move', 'draw_end']) {
    socket.on(event, (payload) => drawEvent(socket, event, payload))
  }

  socket.on('canvas_clear', () => clearCanvas(socket))
  socket.on('draw_undo', () => undoDrawing(socket))
  socket.on('leave_room', () => leaveRoom(socket))

  socket.on('restore_session', (payload) => {
    restoreSession(socket, payload)
  })

  socket.on('request_game_sync', () => {
    const room = getRoomForSocket(socket)
    const player = getPlayer(room, socket)

    if (!room || !player) return

    socket.emit('room_state', publicRoom(room))
    sendGameState(room)

    if (room.status === 'playing') {
      socket.emit('draw_history', {
        strokes: room.strokes,
      })
    }

    if (
      room.status === 'choosing' &&
      room.players[room.drawerIndex]?.id === socket.id
    ) {
      socket.emit('word_choices', {
        words: room.wordOptions,
      })
    }
  })

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id)

    const room = getRoomForSocket(socket)
    const player = getPlayer(room, socket)

    if (!room || !player) return

    if (player.reconnectTimer) {
      clearTimeout(player.reconnectTimer)
    }

    player.reconnectTimer = setTimeout(() => {
      player.reconnectTimer = null

      // Remove the player only if they have not reconnected.
      if (player.id === socket.id && socketRooms.has(socket.id)) {
        leaveRoom(socket)
      }
    }, 120000)
  })
})

server.listen(PORT, () => {
  console.log(`Skribbl backend listening on port ${PORT}`)
})

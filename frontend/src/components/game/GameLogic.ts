
import type { Player } from './GameTypes'

export const DEFAULT_WORDS = [
  'star', 'apple', 'house', 'pizza', 'guitar',
  'rainbow', 'rocket', 'butterfly', 'mountain',
  'football', 'elephant', 'laptop', 'flower',
  'sun', 'ocean', 'bicycle', 'castle', 'airplane',
  'banana', 'camera', 'computer', 'dog', 'cat',
  'tree', 'bridge', 'pencil', 'cloud', 'train',
  'clock', 'ice cream',
]

export function parseCustomWords(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
}

export function getWordPool(
  customWords: string,
  customOnly: boolean,
): string[] {
  const custom = parseCustomWords(customWords)
  const words = customOnly ? custom : [...DEFAULT_WORDS, ...custom]

  return [...new Set(words.map((word) => word.toLowerCase()))].filter(Boolean)
}

export function chooseRandomWord(
  customWords: string,
  customOnly: boolean,
): string {
  const words = getWordPool(customWords, customOnly)
  const pool = words.length > 0 ? words : DEFAULT_WORDS

  return pool[Math.floor(Math.random() * pool.length)]
}

export function createWordChoices(
  customWords: string,
  customOnly: boolean,
  count: number,
): string[] {
  const pool = getWordPool(customWords, customOnly)
  const shuffled = [...(pool.length > 0 ? pool : DEFAULT_WORDS)]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, Math.min(Math.max(1, count), shuffled.length))
}

export function createHint(word: string, revealedCount: number): string {
  let visible = 0

  return word
    .split('')
    .map((letter) => {
      if (letter === ' ') return ' '

      const reveal = visible < revealedCount
      visible += 1

      return reveal ? letter : '_'
    })
    .join(' ')
}

export function rankPlayers(players: Player[]): Player[] {
  return [...players]
    .sort((a, b) => b.points - a.points)
    .map((player, index) => ({ ...player, rank: index + 1 }))
}

export function addPlayerPoints(
  players: Player[],
  playerId: string | undefined,
  points: number,
): Player[] {
  if (!playerId) return players

  // Preserve the array order so scoring never changes the turn sequence.
  return players.map((player) =>
    player.id === playerId
      ? { ...player, points: player.points + points }
      : player,
  )
}

export function getNextTurn(
  currentPlayerIndex: number,
  playerCount: number,
  currentRound: number,
  totalRounds: number,
): {
  nextPlayerIndex: number
  nextRound: number
  gameFinished: boolean
} {
  if (playerCount <= 0) {
    return {
      nextPlayerIndex: 0,
      nextRound: currentRound,
      gameFinished: true,
    }
  }

  if (currentPlayerIndex < playerCount - 1) {
    return {
      nextPlayerIndex: currentPlayerIndex + 1,
      nextRound: currentRound,
      gameFinished: false,
    }
  }

  if (currentRound >= totalRounds) {
    return {
      nextPlayerIndex: 0,
      nextRound: currentRound,
      gameFinished: true,
    }
  }

  return {
    nextPlayerIndex: 0,
    nextRound: currentRound + 1,
    gameFinished: false,
  }
}

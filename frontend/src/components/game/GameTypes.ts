
import type {
  EyeStyle,
  MouthStyle,
} from '../layout/AvatarSelector'

export type ChatMessage = {
  text: string
  type: string
}

export type DrawingPoint = {
  x: number
  y: number
}

export type DrawingStroke = {
  color: string
  width: number
  tool: 'pencil' | 'eraser'
  points: DrawingPoint[]
}

export type Player = {
  id: string
  name: string
  points: number
  color: string
  eye?: EyeStyle
  mouth?: MouthStyle
  face?: string
  rank: number
  isHost: boolean
}

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export type GameRoom = {
  code: string
  hostId: string
  players: Player[]
  settings: Record<string, string>
  status: RoomStatus
  isPrivate: boolean
}

export const players: Player[] = [
  {
    id: '1',
    name: 'Girl',
    points: 120,
    color: '#f2b5a7',
    face: '👩',
    rank: 1,
    isHost: true,
  },
  {
    id: '2',
    name: 'vxz',
    points: 90,
    color: '#c8a5e8',
    face: '😎',
    rank: 2,
    isHost: false,
  },
  {
    id: '3',
    name: 'son of a',
    points: 70,
    color: '#f4d06f',
    face: '😄',
    rank: 3,
    isHost: false,
  },
  {
    id: '4',
    name: 'Keerthana',
    points: 50,
    color: '#8ecae6',
    face: '😊',
    rank: 4,
    isHost: false,
  },
  {
    id: '5',
    name: 'wonheelLLIT',
    points: 30,
    color: '#b7e4c7',
    face: '🐰',
    rank: 5,
    isHost: false,
  },
  {
    id: '6',
    name: 'dhuruv',
    points: 0,
    color: '#ffb703',
    face: '😎',
    rank: 6,
    isHost: false,
  },
  {
    id: '7',
    name: 'Um',
    points: 0,
    color: '#e5989b',
    face: '🙂',
    rank: 7,
    isHost: false,
  },
]

export const initialMessages: ChatMessage[] = [
  {
    text: 'Welcome to the room!',
    type: 'system',
  },
]

export type SettingOption = {
  name: string
  label: string
  icon: string
  initial: string
  options: string[]
}

export const settingOptions: SettingOption[] = [
  {
    name: 'Max Players',
    label: 'Max Players',
    icon: '👥',
    initial: '8',
    options: ['2', '4', '6', '8', '10', '12'],
  },
  {
    name: 'Draw Time',
    label: 'Draw Time',
    icon: '⏱️',
    initial: '80',
    options: ['30', '60', '80', '100', '120'],
  },
  {
    name: 'Rounds',
    label: 'Rounds',
    icon: '🔄',
    initial: '3',
    options: ['1', '2', '3', '4', '5', '6', '8', '10'],
  },
  {
    name: 'Game Mode',
    label: 'Game Mode',
    icon: '🎮',
    initial: 'Normal',
    options: ['Normal', 'Quick', 'Custom'],
  },
  {
    name: 'Word Count',
    label: 'Word Count',
    icon: '📝',
    initial: '3',
    options: ['1', '2', '3'],
  },
  {
    name: 'Hints',
    label: 'Hints',
    icon: '💡',
    initial: 'On',
    options: ['On', 'Off'],
  },
]

export const palette = [
  '#000000',
  '#ffffff',
  '#808080',
  '#c0c0c0',
  '#ff0000',
  '#ff7f00',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#8b00ff',
  '#ff69b4',
  '#8b4513',
  '#008000',
  '#800080',
  '#ffc0cb',
]

export const brushSizes = [2, 4, 8, 12, 18, 24]

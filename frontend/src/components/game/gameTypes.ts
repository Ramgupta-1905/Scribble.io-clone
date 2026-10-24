export type ChatMessage = {
  text: string
  type: string
}

export type DrawingPoint = { x: number; y: number }

export type DrawingStroke = {
  color: string
  width: number
  tool: 'pencil' | 'eraser'
  points: DrawingPoint[]
}

export const players = [
  { rank: 1, name: 'Girl', points: 525, color: '#20dce8', face: '☺' },
  { rank: 3, name: 'vxz', points: 165, color: '#ffcf9e', face: '☺' },
  { rank: 4, name: 'son of a', points: 0, color: '#70e52b', face: '⌁' },
  { rank: 2, name: 'Keerthana', points: 425, color: '#5367ff', face: '☺' },
  { rank: 4, name: 'wonheelLLIT', points: 0, color: '#20dce8', face: '◉' },
  { rank: 4, name: 'dhuruv (You)', points: 0, color: '#ff3434', face: '⌁' },
  { rank: 4, name: 'Um', points: 0, color: '#f06acb', face: '☺' },
]

export const initialMessages: ChatMessage[] = [
  { text: 'Girl is drawing now!', type: 'notice' },
  { text: 'Um joined the room!', type: 'success' },
  { text: 'Keerthana guessed the word!', type: 'success' },
  { text: 'w left the room!', type: 'warning' },
]

export const settingOptions = [
  {
    label: 'Max players',
    icon: '♟',
    name: 'players',
    options: Array.from({ length: 19 }, (_, index) => String(index + 2)),
    initial: '8',
  },
  {
    label: 'Draw time (seconds)',
    icon: '◷',
    name: 'drawtime',
    options: Array.from({ length: 46 }, (_, index) => String(15 + index * 5)),
    initial: '80',
  },
  {
    label: 'Rounds',
    icon: '◉',
    name: 'rounds',
    options: ['2', '3', '4', '5', '6', '7', '8', '9', '10'],
    initial: '3',
  },
  {
    label: 'Word mode',
    icon: '⌁',
    name: 'gameMode',
    options: ['Normal', 'Hidden', 'Combination'],
    initial: 'Normal',
  },
  {
    label: 'Word count',
    icon: '▱',
    name: 'wordCount',
    options: ['1', '2', '3', '4', '5'],
    initial: '3',
  },
  {
    label: 'Hints',
    icon: '?',
    name: 'hints',
    options: ['Disabled', '0', '1', '2', '3', '4', '5'],
    initial: '2',
  },
]

export const palette = [
  '#ffffff', '#bdbdbd', '#ff0000', '#ff6500', '#ffdf00',
  '#00c900', '#00f0a0', '#00b9f5', '#2020df', '#7500c8',
  '#b400bf', '#dc5c9c', '#ffad91',
  '#000000', '#555555', '#8d0000', '#b74300', '#8b7800',
  '#005c20', '#00785b', '#005d8b', '#111166', '#47005e',
  '#65004c', '#8d385b', '#a85a3b',
]

export const brushSizes = [2, 4, 7, 11, 16]

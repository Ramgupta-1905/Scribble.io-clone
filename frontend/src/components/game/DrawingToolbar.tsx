import type { CSSProperties } from 'react'
import { brushSizes, palette } from './gameTypes'

type DrawingToolbarProps = {
  drawingTool: 'pencil' | 'eraser'
  drawingColor: string
  brushSize: number
  strokeCount: number
  canvasBackground: string
  onSelectColor: (color: string) => void
  onSelectTool: (tool: 'pencil' | 'eraser') => void
  onSelectBrushSize: (size: number) => void
  onUndo: () => void
  onClear: () => void
}

const toolbarButtonStyle = (active: boolean): CSSProperties => ({
  height: 38,
  minWidth: 38,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: active ? '2px solid #a76be8' : '1px solid #aaa',
  borderRadius: 3,
  background: active ? '#a76be8' : '#fff',
  color: '#111',
  fontSize: 23,
  cursor: 'pointer',
})

export default function DrawingToolbar({
  drawingTool,
  drawingColor,
  brushSize,
  strokeCount,
  canvasBackground,
  onSelectColor,
  onSelectTool,
  onSelectBrushSize,
  onUndo,
  onClear,
}: DrawingToolbarProps) {
  return (
    <div className="drawing-toolbar" role="toolbar" aria-label="Drawing tools">
      <button
        type="button"
        className="drawing-current-color"
        title={`Current color: ${drawingColor}`}
        style={{ backgroundColor: drawingColor }}
        aria-label={`Current color ${drawingColor}`}
        onClick={() => onSelectTool('pencil')}
      />

      <div className="drawing-palette" role="group" aria-label="Color palette">
        {palette.map((color) => (
          <button
            key={color}
            type="button"
            className={`drawing-color-swatch ${drawingColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
            aria-pressed={drawingColor === color}
            title={color}
            onClick={() => onSelectColor(color)}
          />
        ))}
      </div>

      <div className="drawing-size-menu">
        <button
          type="button"
          className="drawing-size-menu-trigger"
          aria-label={`Brush size ${brushSize}; click to change size`}
          title="Change brush size"
          onClick={() => {
            const index = brushSizes.indexOf(brushSize)
            onSelectBrushSize(brushSizes[(index + 1) % brushSizes.length])
          }}
        >
          <span className="drawing-size-chevron" aria-hidden="true">⌃</span>
          <span
            className="drawing-size-preview"
            style={{ width: brushSize + 3, height: brushSize + 3 }}
          />
        </button>
      </div>

      <div className="drawing-tool-buttons">
        <button
          type="button"
          className={`drawing-tool-button drawing-pencil-button ${drawingTool === 'pencil' ? 'selected' : ''}`}
          style={toolbarButtonStyle(drawingTool === 'pencil')}
          aria-label="Pencil"
          aria-pressed={drawingTool === 'pencil'}
          onClick={() => onSelectTool('pencil')}
          title="Pencil"
        >
          ✏
        </button>
        <button
          type="button"
          className={`drawing-tool-button drawing-eraser-button ${drawingTool === 'eraser' ? 'selected' : ''}`}
          style={toolbarButtonStyle(drawingTool === 'eraser')}
          aria-label="Eraser"
          aria-pressed={drawingTool === 'eraser'}
          onClick={() => onSelectTool('eraser')}
          title="Eraser"
        >
          🧽
        </button>
      </div>

      <div className="drawing-toolbar-spacer" />

      <button
        type="button"
        className="drawing-tool-button drawing-undo-button"
        aria-label="Undo last stroke"
        title="Undo"
        onClick={onUndo}
        disabled={strokeCount === 0}
      >
        ↶
      </button>
      <button
        type="button"
        className="drawing-tool-button drawing-clear-button"
        aria-label="Clear canvas"
        title="Clear canvas"
        onClick={onClear}
        disabled={strokeCount === 0 && canvasBackground === '#ffffff'}
      >
        🗑
      </button>
    </div>
  )
}

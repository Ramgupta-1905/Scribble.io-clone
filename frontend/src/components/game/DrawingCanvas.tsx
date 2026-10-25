
import { useEffect } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { DrawingPoint, DrawingStroke } from './GameTypes'
import { socket } from '../../lib/socket'

type DrawingCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  drawingTool: 'pencil' | 'eraser'
  drawingColor: string
  brushSize: number
  canvasBackground: string
  canDraw?: boolean
  activeStrokeRef: React.MutableRefObject<DrawingStroke | null>
  isDrawingRef: React.MutableRefObject<boolean>
  onStrokeFinished: (stroke: DrawingStroke) => void
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
) {
  if (stroke.points.length === 0) return

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = stroke.width
  context.globalCompositeOperation =
    stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  context.strokeStyle = stroke.color
  context.fillStyle = stroke.color

  const first = stroke.points[0]

  if (stroke.points.length === 1) {
    context.beginPath()
    context.arc(first.x, first.y, stroke.width / 2, 0, Math.PI * 2)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(first.x, first.y)

    for (let i = 1; i < stroke.points.length; i += 1) {
      const previous = stroke.points[i - 1]
      const current = stroke.points[i]

      context.quadraticCurveTo(
        previous.x,
        previous.y,
        (previous.x + current.x) / 2,
        (previous.y + current.y) / 2,
      )
    }

    const last = stroke.points[stroke.points.length - 1]
    context.lineTo(last.x, last.y)
    context.stroke()
  }

  context.restore()
}

export function redrawDrawingCanvas(
  canvas: HTMLCanvasElement | null,
  strokes: DrawingStroke[],
  activeStroke: DrawingStroke | null,
  backgroundColor: string,
) {
  if (!canvas) return

  const context = canvas.getContext('2d')
  if (!context) return

  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const ratio = window.devicePixelRatio || 1
  const pixelWidth = Math.round(rect.width * ratio)
  const pixelHeight = Math.round(rect.height * ratio)

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.globalCompositeOperation = 'source-over'
  context.clearRect(0, 0, rect.width, rect.height)

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, rect.width, rect.height)

  strokes.forEach((stroke) => drawStroke(context, stroke))

  if (activeStroke) {
    drawStroke(context, activeStroke)
  }
}

export default function DrawingCanvas({
  canvasRef,
  drawingTool,
  drawingColor,
  brushSize,
  canvasBackground,
  canDraw = true,
  activeStrokeRef,
  isDrawingRef,
  onStrokeFinished,
}: DrawingCanvasProps) {
  useEffect(() => {
    redrawDrawingCanvas(
      canvasRef.current,
      [],
      null,
      canvasBackground,
    )
  }, [canvasRef, canvasBackground])

  useEffect(() => {
    if (!canDraw) {
      activeStrokeRef.current = null
      isDrawingRef.current = false
    }
  }, [canDraw, activeStrokeRef, isDrawingRef])

  const getPoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): DrawingPoint => {
    const rect = event.currentTarget.getBoundingClientRect()

    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    }
  }

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    if (!canDraw || !socket.connected || isDrawingRef.current) return
    if (event.button !== 0 && event.pointerType === 'mouse') return

    const canvas = event.currentTarget
    const context = canvas.getContext('2d')
    if (!context) return

    event.preventDefault()

    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // Continue if pointer capture is unavailable.
    }

    const point = getPoint(event)

    const stroke: DrawingStroke = {
      color: drawingColor,
      width: brushSize,
      tool: drawingTool,
      points: [point],
    }

    activeStrokeRef.current = stroke
    isDrawingRef.current = true

    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    drawStroke(context, stroke)

    socket.emit('draw_start', {
      x: point.x,
      y: point.y,
      color: stroke.color,
      size: stroke.width,
      tool: stroke.tool,
    })
  }

  const handlePointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const stroke = activeStrokeRef.current

    if (
      !canDraw ||
      !socket.connected ||
      !isDrawingRef.current ||
      !stroke
    ) {
      return
    }

    event.preventDefault()

    const current = getPoint(event)
    const previous = stroke.points[stroke.points.length - 1]

    stroke.points.push(current)

    const context = canvasRef.current?.getContext('2d')

    if (context) {
      const ratio = window.devicePixelRatio || 1
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.save()
      context.beginPath()
      context.moveTo(previous.x, previous.y)
      context.lineTo(current.x, current.y)
      context.lineWidth = stroke.width
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.globalCompositeOperation =
        stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
      context.strokeStyle = stroke.color
      context.stroke()
      context.restore()
    }

    socket.emit('draw_move', {
      x: current.x,
      y: current.y,
      color: stroke.color,
      size: stroke.width,
      tool: stroke.tool,
    })
  }

  const finishDrawing = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    const canvas = event.currentTarget
    const stroke = activeStrokeRef.current

    if (!isDrawingRef.current || !stroke) return

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }

    activeStrokeRef.current = null
    isDrawingRef.current = false

    if (canDraw && socket.connected) {
      socket.emit('draw_end', {
        color: stroke.color,
        size: stroke.width,
        tool: stroke.tool,
      })

      onStrokeFinished(stroke)
    }
  }

  return (
    <section className="drawing-area" aria-label="Drawing canvas">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label={canDraw ? 'Game drawing canvas' : 'View drawing canvas'}
        aria-disabled={!canDraw}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
      />

      <div className="drawing-reactions">
        <button type="button" aria-label="Like drawing">
          👍
        </button>
        <button type="button" aria-label="Dislike drawing">
          👎
        </button>
      </div>
    </section>
  )
}
